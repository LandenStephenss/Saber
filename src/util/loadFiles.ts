import { 
    readdir 
} from 'fs/promises';

export const loadFiles = async <T>(path: string): Promise<T[]> => {
    const files = await readdir(new URL(path, import.meta.url), {
        withFileTypes: true
    });

    const modules = [];
    for (const file of files) {
        const filePath = `${path}/${file.name}`;
        if (file.isDirectory()) {
            modules.push(...(await loadFiles<T>(filePath)))
        } else if (filePath.endsWith('.js')) {
            const imported = await import(filePath);
            modules.push(imported.default ?? imported);
        }
    }

    return modules;
}