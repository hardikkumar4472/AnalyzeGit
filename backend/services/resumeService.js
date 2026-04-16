const pdf = require('pdf-parse');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const analyzeResume = async (fileBuffer, mimeType, jdContent) => {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    let resumeText = "";
    let parts = [];

    if (mimeType === 'application/pdf') {
        try {
            const data = await pdf(fileBuffer);
            resumeText = data.text;
        } catch (err) {
            console.error('PDF Parse Error:', err.message);
        }
    }

    if (!resumeText) {
        // Use multimodal capabilities for Images or failed PDF parsing
        parts = [
            {
                inlineData: {
                    mimeType: mimeType,
                    data: fileBuffer.toString('base64')
                }
            }
        ];
    }

    const prompt = `
Analyze the following resume against the provided Job Description (JD).
Data:
JD: ${JSON.stringify(jdContent)}
${resumeText ? `Resume Text: ${resumeText}` : "Resume is provided as an image/file attachment."}

Requirements:
1. Extract the candidate's name and email.
2. Identify the primary GitHub profile URL (e.g., https://github.com/username). If not found, return null.
3. Provide a score out of 10 based on the fit for the JD.
4. Identify ONLY specific skills that are explicitly required in the JD but are missing from the resume. Return them as an array of short skill names (e.g., "Docker", "Python"). If all required skills are perfectly matched in the resume, return an empty array []. Do not include generic areas of improvement or long sentences.
5. Provide a 2-sentence professional summary of the fit.

Return ONLY as a JSON object:
{
  "name": "string",
  "email": "string",
  "githubUrl": "string or null",
  "analysis": {
    "score": number, 
    "mismatchingSkills": [string],
    "summary": string
  }
}
`;

    parts.push(prompt);

    const result = await model.generateContent(parts);
    const response = await result.response;
    const text = response.text();
    
    return JSON.parse(text);
};

module.exports = { analyzeResume };
