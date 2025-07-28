export class StringUtils {
    /**
     * If formdata contains the fieldName, Trims whitespace from both ends of the field value.
     * @param formData - The map of key-value pairs
     * @param fieldName - The name of the field
     * @returns The trimmed string or null;
     */
    static trimField(formData: FormData, fieldName: string): string | null {
        let result: string | null = null;

        if (formData.has(fieldName)) {
            result = formData.get(fieldName)?.toString().trim() ?? null;
        }

        return result;
    }

    /**
     * Trims the first and last characters from text if text begins with (, [, {, <, ', "
     * @param text - The string to be trimmed
     * @returns The trimmed string or null;
     */
    static trimEndMarkers(text: string): string {
        if (text) {
            if (text.startsWith('[') && text.endsWith(']')) {
                return text.substring(1, text.length - 1);
            } else {
                return text;
            }
        } else {
            return '';
        }
    }

    static extractSlugFromPath(path: string, slugSeq?: number): string | undefined {
        if (slugSeq === undefined) {
            slugSeq = 1;
        }

        const slugPattern = /\[(.*?)\]/g;
        const slugs = [];
        let match;

        while ((match = slugPattern.exec(path)) !== null) {
            slugs.push(match[1]);
        }

        if (slugSeq > 0 && slugSeq <= slugs.length) {
            return slugs[slugSeq - 1];
        }

        return undefined;
    }
}
