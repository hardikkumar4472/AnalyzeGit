const { GoogleGenerativeAI } = require("@google/generative-ai");
const retry = require("async-retry");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const analyzeWithAI = async (data, type, lang = 'en') => {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });
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
    return await retry(async (bail) => {
        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            return JSON.parse(text);
        } catch (error) {
            if (error.status === 400) bail(error);
            
            console.error('AI Service Retryable Error:', error.message);
            throw error; 
        }
    }, {
        retries: 3,
        factor: 2,
        minTimeout: 1000,
        onRetry: (error, attempt) => {
            console.log(`Retrying AI Analysis (Attempt ${attempt}) due to: ${error.message}`);
        }
    });
};

module.exports = { analyzeWithAI };
