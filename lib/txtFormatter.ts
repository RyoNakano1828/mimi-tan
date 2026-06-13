import type { ThemeGroup } from "./types";

export function formatTxt(groups: ThemeGroup[]): string {
  const sections: string[] = [];

  for (const group of groups) {
    sections.push(`# ${group.theme}`);
    sections.push("");

    group.sentences.forEach((sentence, index) => {
      sections.push(String(index + 1));
      sections.push(sentence.english);
      sections.push(sentence.japanese);
      sections.push(sentence.english);
      sections.push("");
    });
  }

  return sections.join("\n").trim() + "\n";
}
