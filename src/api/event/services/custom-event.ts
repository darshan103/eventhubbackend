import axios from "axios";
import * as cheerio from "cheerio";

const { factories } = require("@strapi/strapi");

module.exports = factories.createCoreService(
    "api::event.event",
    ({ strapi }) => ({
     
        async saveHackathonsToDB({ platform, page = 1, limit = 20 }) {
            try {
                if (platform === "devpost") {
                    const items = await this.fetchDevpostHackathons(page, limit);
                    console.log(`Fetched ${items.length} hackathons from Devpost`, items);
                    await this.saveMany(items, "hackathon", "devpost");
                } else {
                    throw new Error(`Platform '${platform}' not supported`);
                }

                return true;
            } catch (err) {
                strapi.log.error("❌ Error in fetchHackathons:", err);
                throw err;
            }
        },

        async saveContestsToDB({ limit = 20 }) {
            try {
                const [cf, lc] = await Promise.all([
                    this.fetchCodeforcesContests(limit),
                    this.fetchLeetCodeContests(limit),
                ]);

                const merged = [...lc, ...cf];
                console.log(`Fetched ${merged.length} contests from Codeforces and LeetCode`, merged);
                await this.saveMany(merged, "contest");

                return true;
            } catch (err) {
                strapi.log.error("❌ Error in fetchContests:", err);
                throw err;
            }
        },

        async saveInternshipsToDB() {
            try {
                const internships = await this.fetchInternshalaInternships();
                console.log(`Fetched ${internships.length} internships from Internshala`, internships);
                await this.saveMany(internships, "internship", "internshala");
                return true;
            } catch (err) {
                strapi.log.error("❌ Error in fetchInternships:", err);
                throw err;
            }
        },

        async saveMany(items, type, platform = null) {
            for (const item of items) {
                await this.upsertEvent(item, type, platform);
            }
        },

        async upsertEvent(item, type, platform) {
            try {
                const externalId = item.id || item.externalId || null;

                const filters = externalId
                    ? { externalId }
                    : { title: item.title, platform: item.platform };

                const existing = await strapi.entityService.findMany(
                    "api::event.event",
                    { filters, limit: 1 }
                );

                function toISO(dateString) {
                    if (!dateString) return null;

                    // If it's already ISO
                    if (!isNaN(Date.parse(dateString))) {
                        return new Date(dateString).toISOString();
                    }

                    // If invalid or "TBD"
                    return null;
                }


                const data = {
                    title: item.title,
                    description: item.description || null,
                    url: item.url,
                    image: item.image,
                    platform: item.platform || platform,
                    type,
                    externalId: externalId ? String(externalId) : null,
                    start_date: toISO(item.start_date),
                    end_date: toISO(item.end_date),
                    company: item.company || null,
                    location: item.location || null,
                    stipend: item.stipend || null,
                    domain: item.domain || null,
                    raw_data: JSON.stringify(item),
                };

                if (existing.length > 0) {
                    await strapi.entityService.update(
                        "api::event.event",
                        existing[0].id,
                        { data }
                    );
                } else {
                    await strapi.entityService.create("api::event.event", { data });
                }
            } catch (err) {
                strapi.log.error("❌ Error saving event:", err);
            }
        },

        async fetchDevpostHackathons(page = 1, limit = 20) {
            try {
                const url = `https://devpost.com/api/hackathons?challenge_type=all&page=${page}`;
                const response = await axios.get(url, {
                    headers: {
                        "User-Agent":
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    },
                });

                const list = response.data.hackathons || [];

                return list.slice(0, limit).map((h) => {
                    const image = h.thumbnail_url
                        ? `https:${h.thumbnail_url}`
                        : "assets/placeholder.png";

                    return {
                        id: h.id,
                        title: h.title,
                        url: h.url,
                        image,
                        platform: "devpost",
                        type: "hackathon",
                        start_date: h.submission_period_dates || null,
                        end_date: h.end_date || null,
                        organization_name: h.organization_name,
                        prize_amount: h.prize_amount,
                        registrations_count: h.registrations_count,
                    };
                });
            } catch (err) {
                strapi.log.error("❌ Error fetching Devpost:", err);
                return [];
            }
        },

        async fetchCodeforcesContests(limit = 20) {
            try {
                const url = "https://codeforces.com/api/contest.list";
                const response = await axios.get(url);
                const contests = response.data.result || [];

                return contests
                    .filter((c) => c.phase === "BEFORE")
                    .slice(0, limit)
                    .map((c) => {
                        const startDate = new Date(c.startTimeSeconds * 1000);

                        return {
                            id: c.id,
                            title: c.name,
                            url: `https://codeforces.com/contests/${c.id}`,
                            image:
                                "https://sta.codeforces.com/s/63901/images/codeforces-logo-with-telegram.png",
                            platform: "codeforces",
                            type: "contest",
                            start_date: startDate.toISOString(),
                            duration_hours: c.durationSeconds / 3600,
                        };
                    });
            } catch (err) {
                strapi.log.error("❌ Codeforces error:", err);
                return [];
            }
        },

        async fetchLeetCodeContests(limit = 20) {
            try {
                const url = "https://leetcode.com/graphql";
                const payload = {
                    query: `
            query {
              allContests {
                title
                titleSlug
                startTime
                duration
              }
            }
          `,
                };

                const response = await axios.post(url, payload, {
                    headers: { "Content-Type": "application/json" },
                });

                const contests = response.data.data.allContests || [];

                return contests
                    .filter((c) => Date.now() < c.startTime * 1000)
                    .slice(0, limit)
                    .map((c, i) => {
                        const startDate = new Date(c.startTime * 1000);

                        return {
                            id: i + 1,
                            title: c.title,
                            url: `https://leetcode.com/contest/${c.titleSlug}`,
                            image: "https://leetcode.com/static/images/LeetCode_Sharing.png",
                            platform: "leetcode",
                            type: "contest",
                            start_date: startDate.toISOString(),
                            duration_hours: c.duration / 3600,
                        };
                    });
            } catch (err) {
                strapi.log.error("❌ LeetCode error:", err);
                return [];
            }
        },

        async fetchInternshalaInternships(
            domains = [
                "software developer",
                "full stack developer",
                "frontend developer",
                "react developer",
                "node developer",
            ],
            perDomainLimit = 10
        ) {
            const results: any[] = [];
            const seen = new Set<string>(); // 🔐 dedup tracker

            for (const domain of domains) {
                try {
                    const url = `https://internshala.com/internships/${encodeURIComponent(
                        domain
                    )}-internship`;

                    const { data } = await axios.get(url, {
                        headers: { "User-Agent": "Mozilla/5.0" },
                    });

                    const $ = cheerio.load(data);
                    let count = 0;

                    $(".individual_internship").each((i, el) => {
                        if (count >= perDomainLimit) return false;

                        const title = $(el).find(".job-internship-name").text().trim();
                        const company = $(el).find(".company-name").first().text().trim();
                        const location = $(el).find(".locations").text().trim();
                        const stipend = $(el).find(".stipend").text().trim();
                        const relativeUrl = $(el)
                            .find(".job-internship-name a")
                            .attr("href");

                        const fullUrl = relativeUrl
                            ? `https://internshala.com${relativeUrl}`
                            : null;

                        // 🔑 Deduplication key
                        const dedupKey =
                            fullUrl ||
                            `${title.toLowerCase()}-${company.toLowerCase()}-${domain}`;

                        // ⛔ Skip duplicates
                        if (seen.has(dedupKey)) return;

                        seen.add(dedupKey);

                        results.push({
                            id: `${domain}-${i}`,
                            title,
                            company,
                            location,
                            stipend,
                            url: fullUrl,
                            platform: "internshala",
                            type: "internship",
                            domain,
                        });

                        count++;
                    });
                } catch (err) {
                    strapi.log.error(`❌ Internshala error: ${domain}`, err);
                }
            }

            return results;
        },

        async saveAllEvents() {
            console.log("Saving all events...");
            await this.saveHackathonsToDB({ platform: "devpost", page: 1, limit: 20 });
            await this.saveContestsToDB({ limit: 20 });
            await this.saveInternshipsToDB();
        }
    })
);
