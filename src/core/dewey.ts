export const deweyCategories: Record<string, string> = {
    "000": "Generalities",
    "100": "Philosophy and Psychology",
    "200": "Religion",
    "300": "Social Sciences",
    "400": "Language",
    "500": "Science",
    "600": "Technology",
    "700": "Arts and Recreation",
    "800": "Literature",
    "900": "History and Geography"
};

export function getDeweyCategory(subject: string): string {
    const subjectToDewey: Record<string, string> = {
        "philosophy": "100",
        "psychology": "100",
        "religion": "200",
        "economics": "300",
        "politics": "300",
        "language": "400",
        "linguistics": "400",
        "science": "500",
        "technology": "600",
        "art": "700",
        "literature": "800",
        "history": "900",
        "geography": "900"
    };

    const categoryKey = Object.keys(subjectToDewey).find(key =>
        subject.toLowerCase().includes(key)
    );

    return categoryKey ? subjectToDewey[categoryKey] : "000";
}