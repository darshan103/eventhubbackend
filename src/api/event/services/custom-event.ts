import axios from 'axios';
import * as cheerio from "cheerio";

const { factories } = require("@strapi/strapi");
module.exports = factories.createCoreService(
    "api::event.event",
    ({ strapi }) => ({
        async fetchHackathons({ platform, page = 1, limit = 10 }) {
            try {
                if (platform === 'devpost') {
                    return await this.fetchDevpostHackathons(page, limit);
                }
                // You can later add: else if (platform === 'hackerearth') {...}
                else {
                    throw new Error(`Platform '${platform}' not supported yet`);
                }
            } catch (err) {
                strapi.log.error('Error fetching challenges:', err);
                throw err;
            }
        },
        async fetchContests({ limit = 20 }) {
            try {
                const [codeforces, leetcode] = await Promise.all([
                    this.fetchCodeforcesContests(limit),
                    this.fetchLeetCodeContests(limit),
                ]);

                const combined = [...leetcode, ...codeforces];
                console.log(`🎯 Total contests found: ${combined.length}`);
                return combined;
            } catch (err) {
                strapi.log.error('Error fetching challenges:', err);
                throw err;
            }
        },
        async fetchInternships({ limit = 10 }) {
            try {
                return await this.fetchInternshalaInternships();
            } catch (err) {
                strapi.log.error('Error fetching challenges:', err);
                throw err;
            }
        },

        /**
         * Fetch hackathons from Devpost
         */
        async fetchDevpostHackathons(page = 1, limit = 10) {
            try {
                const url = `https://devpost.com/api/hackathons?challenge_type=all&page=${page}`;
                const response = await axios.get(url, {
                    headers: {
                        "User-Agent":
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117 Safari/537.36",
                        Accept: "application/json",
                    },
                });

                const hackathons = response.data.hackathons || [];

                const challenges = hackathons.slice(0, limit).map((h) => {
                    // Fallback logic for URL (different API versions may use url_slug or url)
                    const slug = h.url_slug || h.url || "";
                    const fullUrl = slug.startsWith("http")
                        ? slug
                        : `https://devpost.com${slug}`;

                    // Handle image fallbacks
                    let image =
                        h.image_url ||
                        h.cover_image_url ||
                        h.banner_url ||
                        h.thumbnail_url ||
                        (h.image && h.image.url) ||
                        null;

                    if (image && image.startsWith("//")) {
                        image = `https:${image}`;
                    }

                    return {
                        id: h.id,
                        title: h.title || "Untitled Hackathon",
                        url: fullUrl,
                        description: h.blurb || "No description available.",
                        image,
                        type: "hackathon",
                        platform: "devpost",
                        start_date: h.start_date || null,
                        end_date: h.end_date || null,
                        status: h.status || "unknown",
                        organization_name: h.organization_name || null,
                        city: h.city || "Remote",
                        country: h.country || "",
                    };
                });

                console.log(`✅ Found ${challenges.length} Devpost challenges`);
                return challenges;
            } catch (err) {
                strapi.log.error('Error fetching Devpost challenges:', err);
                throw err;
            }
        },
        async fetchCodeforcesContests(limit = 10) {
            try {
                const url = "https://codeforces.com/api/contest.list";
                const response = await axios.get(url);
                const contests = response.data.result || [];

                const upcoming = contests
                    .filter((c) => c.phase === "BEFORE")
                    .slice(0, limit)
                    .map((c) => ({
                        id: c.id,
                        title: c.name,
                        url: `https://codeforces.com/contests/${c.id}`,
                        description: "Official Codeforces programming contest",
                        image: "https://sta.codeforces.com/s/63901/images/codeforces-logo-with-telegram.png",
                        platform: "codeforces",
                        type: "contest",
                        start_date: new Date(c.startTimeSeconds * 1000).toISOString(),
                        duration_hours: c.durationSeconds / 3600,
                        status: c.phase,
                    }));

                console.log(`✅ Found ${upcoming.length} Codeforces contests`);
                return upcoming;
            } catch (err) {
                console.error("❌ Error fetching Codeforces contests:", err.message);
                return [];
            }
        },
        async fetchLeetCodeContests(limit = 10) {
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
                            isVirtual
                            }
                        }
                    `,
                    variables: {},
                };

                const response = await axios.post(url, payload, {
                    headers: {
                        "Content-Type": "application/json",
                        "User-Agent": "EventHub/1.0",
                    },
                });

                const contests = response.data.data.allContests || [];
                const upcoming = contests
                    .filter((c) => Date.now() < c.startTime * 1000)
                    .slice(0, limit)
                    .map((c, i) => ({
                        id: i + 1,
                        title: c.title,
                        url: `https://leetcode.com/contest/${c.titleSlug}`,
                        description: "LeetCode coding contest",
                        image:
                            "https://leetcode.com/static/images/LeetCode_Sharing.png",
                        platform: "leetcode",
                        type: "contest",
                        start_date: new Date(c.startTime * 1000).toISOString(),
                        duration_hours: c.duration / 3600,
                    }));

                console.log(`✅ Found ${upcoming.length} LeetCode contests`);
                return upcoming;
            } catch (err) {
                console.error("❌ Error fetching LeetCode contests:", err.message);
                return [];
            }
        },
        async fetchInternshalaInternships(domains = [
            "software developer",
            "full stack developer",
            "frontend developer",
            "backend developer",
            "angular developer",
            "react developer",
            "web developer",
            "nodejs developer",
            "python developer",
            "java developer",
        ]) {
            const allInternships = [];

            for (const domain of domains) {
                strapi.log.info(`🔍 Fetching internships for domain: ${domain}`);
                try {
                    const query = encodeURIComponent(domain);
                    const url = `https://internshala.com/internships/${query}-internship`;

                    const { data } = await axios.get(url, {
                        headers: {
                            "User-Agent":
                                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117 Safari/537.36",
                            "Accept-Language": "en-US,en;q=0.9",
                        },
                    });

                    const $ = cheerio.load(data);
                    const internships = [];

                    $(".individual_internship").each((i, el) => {
                        const title = $(el).find(".heading_4_5").text().trim();
                        const company = $(el).find(".heading_6 span").first().text().trim();
                        const location = $(el).find("[id^='location_names']").text().trim();
                        const stipend = $(el).find(".stipend").text().trim() || "Not disclosed";
                        const duration = $(el).find(".item_body").eq(1).text().trim();
                        const start_date = $(el).find(".item_body").first().text().trim();
                        const relativeUrl = $(el).find(".view_detail_button").attr("href") || "";
                        const url = `https://internshala.com${relativeUrl}`;
                        const image = $(el).find("img").attr("src") || null;

                        internships.push({
                            id: `${domain}-${i + 1}`,
                            title,
                            company,
                            location,
                            stipend,
                            duration,
                            start_date,
                            url,
                            image,
                            platform: "internshala",
                            domain,
                        });
                    });

                    strapi.log.info(`✅ Found ${internships.length} internships for ${domain}`);
                    allInternships.push(...internships);
                } catch (err) {
                    strapi.log.error(`❌ Failed to fetch ${domain} internships: ${err.message}`);
                }
            }

            strapi.log.info(`✅ Total internships fetched: ${allInternships.length}`);
            return allInternships;
        },
        }));
