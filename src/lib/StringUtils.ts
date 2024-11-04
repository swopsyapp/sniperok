export class StringUtils {
    /**
     * If formdata contains the fieldName, Trims whitespace from both ends of the field value.
     * @param formData - The map of key-value pairs
     * @param fieldName - The name of the field
     * @returns The trimmed string or null;
     */
    static trimField(formData: FormData, fieldName: string): string | null {
        let result : string | null = null;

        if ( formData.has(fieldName) ) {
            result = formData.get(fieldName)?.toString().trim() ?? null;
        }

        return result;
    }
}
