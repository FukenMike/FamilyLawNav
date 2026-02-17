import { ClassifiedQuery } from "@/types";

// This function extracts JSON from a string that might contain markdown formatting
const extractJsonFromString = (text: string): string => {
  // Check if the response is wrapped in markdown code blocks
  const jsonRegex = /```(?:json)?\s*({[\s\S]*?})\s*```/;
  const match = text.match(jsonRegex);
  
  if (match && match[1]) {
    // Return just the JSON part without the markdown formatting
    return match[1].trim();
  }
  
  // If no markdown formatting, try to find JSON object in the text
  const objectRegex = /({[\s\S]*?})/;
  const objectMatch = text.match(objectRegex);
  
  if (objectMatch && objectMatch[1]) {
    return objectMatch[1].trim();
  }
  
  // If we can't extract JSON, return the original text
  return text.trim();
};

// This is a mock implementation for the AI classification service
// In a real implementation, this would call the OpenAI API
export const classifyQuery = async (query: string): Promise<ClassifiedQuery> => {
  try {
    // In a real implementation, this would be a call to the OpenAI API
    const LLM_ENDPOINT = process.env.EXPO_PUBLIC_LLM_ENDPOINT;
    if (!LLM_ENDPOINT) {
      throw new Error("Missing EXPO_PUBLIC_LLM_ENDPOINT. Please set it in your environment (see .env.example). This is required to use AI features.");
    }
    const response = await fetch(LLM_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `You are a legal query classifier. Given a user query about family law, extract:
            1. The US state mentioned (return state abbreviation)
            2. The legal category (one of: custody, cps-dhr, foster-care, child-support, icpc, visitation, adoption, paternity, guardianship, divorce)
            3. The county if mentioned
            4. A refined search query that would be effective for web search
            
            Return ONLY a JSON object with these fields: state_id, category_id, county_id (optional), refined_query.
            Do not include any markdown formatting, explanations, or code blocks. Just return the raw JSON object.
            If state or category cannot be determined, make your best guess based on context.`
          },
          {
            role: "user",
            content: query
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to classify query");
    }

    const data = await response.json();
    
    // Extract JSON from the AI response, handling potential markdown formatting
    const jsonString = extractJsonFromString(data.completion);
    
    try {
      // Try to parse the extracted JSON
      const parsedResult = JSON.parse(jsonString);
      
      return {
        original_query: query,
        state_id: parsedResult.state_id,
        category_id: parsedResult.category_id,
        county_id: parsedResult.county_id,
        refined_query: parsedResult.refined_query
      };
    } catch (parseError) {
      console.error("Error parsing JSON from AI response:", parseError);
      console.log("Raw AI response:", data.completion);
      console.log("Extracted JSON string:", jsonString);
      throw new Error("Failed to parse AI response");
    }
  } catch (error) {
    console.error("Error classifying query:", error);
    // Fallback classification if AI fails
    return {
      original_query: query,
      state_id: "AL", // Default to Alabama
      category_id: "custody", // Default to custody
      refined_query: query
    };
  }
};

export const summarizeLegalText = async (text: string, title: string): Promise<string> => {
  try {
    const LLM_ENDPOINT = process.env.EXPO_PUBLIC_LLM_ENDPOINT;
    if (!LLM_ENDPOINT) {
      throw new Error("Missing EXPO_PUBLIC_LLM_ENDPOINT. Please set it in your environment (see .env.example). This is required to use AI features.");
    }
    const response = await fetch(LLM_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `You are a legal text summarizer for parents and families. 
            Summarize the following legal text in plain, simple language that a non-lawyer can understand. 
            Focus on practical implications, rights, and next steps. 
            Keep your summary concise (3-5 paragraphs maximum) but comprehensive.`
          },
          {
            role: "user",
            content: `Title: ${title}

Text: ${text}`
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to summarize text");
    }

    const data = await response.json();
    return data.completion;
  } catch (error) {
    console.error("Error summarizing text:", error);
    return "Unable to generate summary. Please read the original text for accurate information.";
  }
};
// TODO(PHASE-?): Implement this module fully
