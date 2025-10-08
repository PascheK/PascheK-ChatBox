import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

// changer chunkSzie pour la prod, plus grand
export const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: [" "],
});

export async function chunkContent(content: string) {
  return await textSplitter.splitText(content.trim());
}
