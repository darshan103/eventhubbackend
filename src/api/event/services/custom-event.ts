import axios from 'axios';
import * as cheerio from 'cheerio';

const { factories } = require("@strapi/strapi");
module.exports = factories.createCoreService(
    "api::event.event",
    ({ strapi }) => ({ 
        async fetchChallenges({ platform, page = 1, limit = 10 }) {
            try {
                if (platform === 'devpost') {
                    return await this.fetchDevpostChallenges(page, limit);
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

        /**
         * Fetch challenges from Devpost
         */
        async fetchDevpostChallenges(page = 1, limit = 10) {
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

                    return {
                        id: h.id,
                        title: h.title || "Untitled Hackathon",
                        url: fullUrl,
                        description: h.blurb || "No description available.",
                        image: h.image_url || null,
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
    }));
