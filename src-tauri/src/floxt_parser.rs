use fancy_regex::{Captures, Regex};

// Import/export parsers

#[tauri::command]
pub fn convert_markdown_to_floxt(md: &str) -> String {
    let mut floxt = md.to_string();

    let code_block_re = Regex::new(r"(?s)```([\s\S]*?)```").unwrap();
    floxt = code_block_re.replace_all(&floxt, "/code;\n$1\n;/").into_owned();

    let bold_1 = Regex::new(r"\*\*(.*?)\*\*").unwrap();
    let bold_2 = Regex::new(r"__(.*?)__").unwrap();
    let italic_1 = Regex::new(r"\*(.*?)\*").unwrap();
    let italic_2 = Regex::new(r"_(.*?)_").unwrap();
    let strike = Regex::new(r"~~(.*?)~~").unwrap();
    let highlight_1 = Regex::new(r"==(.*?)==").unwrap();
    let highlight_2 = Regex::new(r"(?i)<mark>(.*?)</mark>").unwrap();

    floxt = bold_1.replace_all(&floxt, "/b;$1;/").into_owned();
    floxt = bold_2.replace_all(&floxt, "/b;$1;/").into_owned();
    floxt = italic_1.replace_all(&floxt, "/i;$1;/").into_owned();
    floxt = italic_2.replace_all(&floxt, "/i;$1;/").into_owned();
    floxt = strike.replace_all(&floxt, "/s;$1;/").into_owned();
    floxt = highlight_1.replace_all(&floxt, "/h;$1;/").into_owned();
    floxt = highlight_2.replace_all(&floxt, "/h;$1;/").into_owned();

    let img_re = Regex::new(r"!\[(.*?)\]\((.*?)\)").unwrap();
    let link_re = Regex::new(r"\[(.*?)\]\((.*?)\)").unwrap();
    floxt = img_re.replace_all(&floxt, "/img;$2;$1;/").into_owned();
    floxt = link_re.replace_all(&floxt, "/link;$2;$1;/").into_owned();

    let h_re = Regex::new(r"^(#{1,6})\s+(.*)$").unwrap();
    let uncheck_re = Regex::new(r"^[\*\-]\s+\[\s\]\s+(.*)$").unwrap();
    let check_re = Regex::new(r"^[\*\-]\s+\[[xX]\]\s+(.*)$").unwrap();
    let ul_re = Regex::new(r"^[\*\-]\s+(.*)$").unwrap();
    let ol_re = Regex::new(r"^\d+\.\s+(.*)$").unwrap();

    let lines: Vec<&str> = floxt.lines().collect();
    let mut processed_lines = Vec::new();

    for line in lines {
        if let Ok(Some(caps)) = h_re.captures(line) {
            let level = caps.get(1).unwrap().as_str().len();
            processed_lines.push(format!("/h{};{};/", level, caps.get(2).unwrap().as_str()));
        } else if let Ok(Some(caps)) = uncheck_re.captures(line) {
            processed_lines.push(format!("/[];{}", caps.get(1).unwrap().as_str()));
        } else if let Ok(Some(caps)) = check_re.captures(line) {
            processed_lines.push(format!("/[x];{}", caps.get(1).unwrap().as_str()));
        } else if let Ok(Some(caps)) = ul_re.captures(line) {
            processed_lines.push(format!("/-;-{};/", caps.get(1).unwrap().as_str()));
        } else if let Ok(Some(caps)) = ol_re.captures(line) {
            processed_lines.push(format!("/0;-{};/", caps.get(1).unwrap().as_str()));
        } else {
            processed_lines.push(line.to_string());
        }
    }

    processed_lines.join("\n")
}

#[tauri::command]
pub fn convert_floxt_to_markdown(text: &str) -> String {
    let mut md = text.to_string();
    let block_re = Regex::new(r"/(h1|h2|h3|h4|h5|h6|b|i|u|s|-|0|O|code|table|h);((?:(?!/(?:h1|h2|h3|h4|h5|h6|b|i|u|s|-|0|O|code|table|link|img|h);)[\s\S])*?);/").unwrap();
    let link_re = Regex::new(r"/link;([^;]+);((?:(?!/(?:h1|h2|h3|h4|h5|h6|b|i|u|s|-|0|O|code|table|link|img|h);)[\s\S])*?);/").unwrap();
    let img_re = Regex::new(r"/img;([^;]+);((?:(?!/(?:h1|h2|h3|h4|h5|h6|b|i|u|s|-|0|O|code|table|link|img|h);)[\s\S])*?);/").unwrap();
    let ul_replace_re = Regex::new(r"(?m)^\s*-\s*([^\r\n]*)(?:\r?\n)?").unwrap();

    let mut previous = String::new();

    while md != previous {
        previous = md.clone();

        md = block_re.replace_all(&md, |caps: &Captures| {
            let tag = caps.get(1).map_or("", |m| m.as_str());
            let content = caps.get(2).map_or("", |m| m.as_str());
            match tag {
                "h1" => format!("# {}", content),
                "h2" => format!("## {}", content),
                "h3" => format!("### {}", content),
                "h4" => format!("#### {}", content),
                "h5" => format!("##### {}", content),
                "h6" => format!("###### {}", content),
                "b" => format!("**{}**", content),
                "i" => format!("*{}*", content),
                "u" => format!("<u>{}</u>", content),
                "s" => format!("~~{}~~", content),
                "h" => format!("=={}==", content),
                "-" => {
                    let clean = content.trim();
                    let list_items = ul_replace_re.replace_all(clean, "- $1\n");
                    format!("{}\n", list_items)
                },
                "0" | "O" => {
                    let clean = content.trim();
                    let mut i = 1;
                    let list_items = ul_replace_re.replace_all(clean, |cap: &Captures| {
                        let res = format!("{}. {}\n", i, cap.get(1).unwrap().as_str());
                        i += 1;
                        res
                    });
                    format!("{}\n", list_items)
                },
                "code" => format!("```\n{}\n```", content),
                "table" => {
                    let lines: Vec<&str> = content.trim().lines().collect();
                    if lines.is_empty() { return String::new(); }
                    
                    let headers: Vec<&str> = lines[0].split('|').map(|c| c.trim()).collect();
                    let header_row = format!("| {} |", headers.join(" | "));
                    let separator_row = format!("| {} |", vec!["---"; headers.len()].join(" | "));
                    
                    let mut body_rows = String::new();
                    if lines.len() > 1 {
                        let rows: Vec<String> = lines[1..].iter().map(|line| {
                            let cells: Vec<&str> = line.split('|').map(|c| c.trim()).collect();
                            format!("| {} |", cells.join(" | "))
                        }).collect();
                        body_rows = format!("\n{}", rows.join("\n"));
                    }
                    format!("\n{}\n{}{}\n", header_row, separator_row, body_rows)
                },
                _ => content.to_string(),
            }
        }).into_owned();

        md = link_re.replace_all(&md, |caps: &Captures| {
            let url = caps.get(1).map_or("", |m| m.as_str());
            let placeholder = caps.get(2).map_or("", |m| m.as_str());
            format!("[{}]({})", placeholder, url)
        }).into_owned();

        md = img_re.replace_all(&md, |caps: &Captures| {
            let url = caps.get(1).map_or("", |m| m.as_str());
            let alt = caps.get(2).map_or("", |m| m.as_str());
            format!("![{}]({})", alt, url)
        }).into_owned();
    }

    md = Regex::new(r"/\[\];").unwrap().replace_all(&md, "- [ ]").into_owned();
    md = Regex::new(r"(?i)/\[x\];").unwrap().replace_all(&md, "- [x]").into_owned();

    md
}

#[tauri::command]
pub fn generate_html(text: &str, file_name: &str) -> String {
    let mut html = text
        .replace("&", "__FLXT_AMP__")
        .replace("<", "__FLXT_LT__")
        .replace(">", "__FLXT_GT__");

    let block_re = Regex::new(r"/(h1|h2|h3|h4|h5|h6|b|i|u|s|-|0|O|code|table|h);((?:(?!/(?:h1|h2|h3|h4|h5|h6|b|i|u|s|-|0|O|code|table|link|img|h);)[\s\S])*?);/").unwrap();
    let link_re = Regex::new(r"/link;([^;]+);((?:(?!/(?:h1|h2|h3|h4|h5|h6|b|i|u|s|-|0|O|code|table|link|img|h);)[\s\S])*?);/").unwrap();
    let img_re = Regex::new(r"/img;([^;]+);((?:(?!/(?:h1|h2|h3|h4|h5|h6|b|i|u|s|-|0|O|code|table|link|img|h);)[\s\S])*?);/").unwrap();
    let ul_replace_re = Regex::new(r"(?m)^\s*-\s*([^\r\n]*)(?:\r?\n)?").unwrap();

    let mut previous = String::new();

    while html != previous {
        previous = html.clone();

        html = block_re.replace_all(&html, |caps: &Captures| {
            let tag = caps.get(1).map_or("", |m| m.as_str());
            let content = caps.get(2).map_or("", |m| m.as_str());

            match tag {
                "h1" => format!("<h1>{}</h1>", content),
                "h2" => format!("<h2>{}</h2>", content),
                "h3" => format!("<h3>{}</h3>", content),
                "h4" => format!("<h4>{}</h4>", content),
                "h5" => format!("<h5>{}</h5>", content),
                "h6" => format!("<h6>{}</h6>", content),
                "b" => format!("<strong>{}</strong>", content),
                "i" => format!("<em>{}</em>", content),
                "u" => format!("<u>{}</u>", content),
                "s" => format!("<del>{}</del>", content),
                "h" => format!("<mark>{}</mark>", content),
                "-" => {
                    let list_items = ul_replace_re.replace_all(content.trim(), "<li>$1</li>");
                    format!("<ul>\n{}\n</ul>", list_items)
                },
                "0" | "O" => {
                    let list_items = ul_replace_re.replace_all(content.trim(), "<li>$1</li>");
                    format!("<ol>\n{}\n</ol>", list_items)
                },
                "code" => {
                    let clean = content.trim_matches('\n');
                    format!("<pre><code>{}</code></pre>", clean)
                },
                "table" => {
                    let lines: Vec<&str> = content.trim().lines().collect();
                    if lines.is_empty() { return String::new(); }
                    
                    let headers = lines[0].split('|').map(|c| format!("<th>{}</th>", c.trim())).collect::<String>();
                    let thead = format!("<thead><tr>{}</tr></thead>", headers);
                    
                    let mut tbody = String::new();
                    if lines.len() > 1 {
                        let rows = lines[1..].iter().map(|line| {
                            let cells = line.split('|').map(|c| format!("<td>{}</td>", c.trim())).collect::<String>();
                            format!("<tr>{}</tr>", cells)
                        }).collect::<String>();
                        tbody = format!("<tbody>{}</tbody>", rows);
                    }
                    format!("<table>{}{}</table>", thead, tbody)
                },
                _ => content.to_string(),
            }
        }).into_owned();

        html = link_re.replace_all(&html, |caps: &Captures| {
            let url = caps.get(1).map_or("", |m| m.as_str());
            let placeholder = caps.get(2).map_or("", |m| m.as_str());
            format!(r#"<a href="{}">{}</a>"#, url, placeholder)
        }).into_owned();

        html = img_re.replace_all(&html, |caps: &Captures| {
            let url = caps.get(1).map_or("", |m| m.as_str());
            let alt = caps.get(2).map_or("", |m| m.as_str());
            format!(r#"<img src="{}" alt="{}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0;" loading="lazy" />"#, url, alt)
        }).into_owned();
    }

    html = Regex::new(r"/\[\];").unwrap().replace_all(&html, r#"<input type="checkbox" disabled />"#).into_owned();
    html = Regex::new(r"(?i)/\[x\];").unwrap().replace_all(&html, r#"<input type="checkbox" checked disabled />"#).into_owned();

    html = html
        .replace("__FLXT_AMP__", "&amp;")
        .replace("__FLXT_LT__", "&lt;")
        .replace("__FLXT_GT__", "&gt;");

    format!(r#"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{}</title>
    <style>
        body {{ font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #171717; background-color: #fdfdfd; white-space: pre-wrap; transition: background-color 0.2s, color 0.2s; }}
        pre {{ background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; white-space: pre; border: 1px solid #e5e5e5; }}
        code {{ font-family: monospace; }}
        a {{ color: #2563eb; }}
        table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
        th, td {{ border: 1px solid #e5e5e5; padding: 10px; text-align: left; }}
        th {{ background-color: #f4f4f4; }}
        
        @media (prefers-color-scheme: dark) {{
            body {{ color: #e5e5e5; background-color: #0a0a0a; }}
            pre {{ background: #171717; border-color: #262626; }}
            a {{ color: #60a5fa; }}
            th, td {{ border-color: #262626; }}
            th {{ background-color: #171717; }}
        }}

        @media print {{
            @page {{ margin: 0; }} 
            body {{ background-color: white !important; color: black !important; margin: 0; padding: 0.5in; }}
            pre {{ background: #f4f4f4 !important; border-color: #ccc !important; }}
            a {{ color: #2563eb !important; text-decoration: none; }}
            table {{ page-break-inside: auto; }}
            tr {{ page-break-inside: avoid; page-break-after: auto; }}
        }}
    </style>
</head>
<body>
{}
</body>
</html>"#, file_name, html.trim())
}