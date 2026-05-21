import os
import re
import requests

USERNAME = "lavren007"
PROFILE_REPO = f"{USERNAME}/{USERNAME}"
TOP_N = 5

GITHUB_TOKEN = os.environ.get("GH_TOKEN")
HEADERS = {"Authorization": f"token {GITHUB_TOKEN}"} if GITHUB_TOKEN else {}

def get_recent_repos():
    """Возвращает TOP_N самых новых репозиториев (по дате создания)."""
    url = f"https://api.github.com/users/{USERNAME}/repos?per_page=100&sort=created&direction=desc&type=owner"
    resp = requests.get(url, headers=HEADERS)
    resp.raise_for_status()
    repos = resp.json()
    # Исключаем профильный репозиторий
    filtered = [r for r in repos if r["full_name"] != PROFILE_REPO]
    return filtered[:TOP_N]

def format_repo_table(repos):
    """Генерирует Markdown-таблицу."""
    lines = [
        "| Проект | Описание | ⭐ Звёзды | 🛠 Язык |",
        "|--------|----------|-----------|---------|"
    ]
    for repo in repos:
        name = f"[{repo['name']}]({repo['html_url']})"
        desc = (repo.get("description") or "").replace("|", "\\|")
        if len(desc) > 80:
            desc = desc[:77] + "..."
        stars = repo.get("stargazers_count", 0)
        lang = repo.get("language") or "—"
        lines.append(f"| {name} | {desc} | {stars} | {lang} |")
    return "\n".join(lines)

def extract_project_names_from_readme(readme_text, start_marker, end_marker):
    """Извлекает имена проектов из текущей таблицы в README."""
    pattern = rf"{re.escape(start_marker)}(.*?){re.escape(end_marker)}"
    match = re.search(pattern, readme_text, re.DOTALL)
    if not match:
        return set()
    table_block = match.group(1)
    # Ищем строки таблицы: | [имя](url) | ...
    names = set()
    for line in table_block.splitlines():
        if line.startswith("|") and not line.startswith("|--") and not "Проект" in line:
            parts = line.split("|")
            if len(parts) >= 2:
                cell = parts[1].strip()
                # Извлекаем имя из [name](url)
                m = re.search(r"\[(.*?)\]", cell)
                if m:
                    names.add(m.group(1))
    return names

def update_readme():
    with open("README.md", "r", encoding="utf-8") as f:
        old_readme = f.read()

    start = "<!-- START_PROJECT_LIST -->"
    end = "<!-- END_PROJECT_LIST -->"

    if start not in old_readme or end not in old_readme:
        raise ValueError("Маркеры START/END_PROJECT_LIST не найдены в README.md")

    # Текущие имена проектов из README
    old_names = extract_project_names_from_readme(old_readme, start, end)

    # Новый список репозиториев
    repos = get_recent_repos()
    new_names = {r["name"] for r in repos}

    if old_names == new_names:
        print("✅ Список проектов не изменился. README не обновляется.")
        return

    print("🔄 Обнаружено изменение списка проектов. Обновляем README...")
    new_table = format_repo_table(repos)
    new_block = f"{start}\n{new_table}\n{end}"

    # Замена блока между маркерами
    before = old_readme.split(start)[0]
    after = old_readme.split(end)[1]
    updated_readme = before + new_block + after

    with open("README.md", "w", encoding="utf-8") as f:
        f.write(updated_readme)

    print("🎉 README.md успешно обновлён.")

if __name__ == "__main__":
    update_readme()