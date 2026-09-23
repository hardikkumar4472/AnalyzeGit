const { GoogleGenerativeAI } = require("@google/generative-ai");
const retry = require("async-retry");
const FLASH_MODELS = [
    process.env.GEMINI_MODEL,
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash"
].filter(Boolean);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const analyzeWithAI = async (data, type, lang = 'en') => {
    const targetLang = lang === 'hi' ? 'Hindi' : 'English';
    let prompt = "";

    if (type === 'user') {
        prompt = `
Analyze the following GitHub User Profile and provide a scorecard.
Data: ${JSON.stringify({
            login: data.profile.login,
            bio: data.profile.bio,
            public_repos: data.profile.public_repos,
            followers: data.profile.followers,
            topRepos: data.topRepos
        })}

Requirements:
1. Provide a generalized overall score out of 10.
2. Provide exactly 5 Good points.
3. Provide exactly 5 Bad points.
4. Provide a 2-3 sentence visual summary.

IMPORTANT: Content in the JSON must be in ${targetLang}.

Return ONLY as a JSON object:
{
  "score": number, 
  "goodPoints": [string, string, string, string, string],
  "badPoints": [string, string, string, string, string],
  "summary": string
}
        `;
    } else {
        prompt = `
Analyze binary repository data and provide a "Deep Code Quality" assessment.
Data: ${JSON.stringify({ 
            name: data.details.name, 
            description: data.details.description,
            readme: data.readme.substring(0, 3000), 
            structure: data.structure,
            language: data.languages
        })}

Requirements:
1. Provide a score out of 10.
2. Provide exactly 5 Good points.
3. Provide exactly 5 Bad points.
4. Provide a 2-3 sentence modularity insight.

IMPORTANT: Content in the JSON must be in ${targetLang}.

Return ONLY as a JSON object:
{
  "score": number, 
  "goodPoints": [string, string, string, string, string],
  "badPoints": [string, string, string, string, string],
  "summary": string
}
        `;
    }
    let lastError = null;
    for (const modelName of FLASH_MODELS) {
        try {
            const model = genAI.getGenerativeModel({ 
                model: modelName,
                generationConfig: { responseMimeType: "application/json" }
            });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return JSON.parse(response.text());
        } catch (error) {
            console.warn(`[AI Service] Model ${modelName} failed (${error.message}), trying next Flash model...`);
            lastError = error;
        }
    }
    throw lastError || new Error("All Gemini Flash models failed");
};

module.exports = { analyzeWithAI };
