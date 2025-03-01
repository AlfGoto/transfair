export function extensionToMimeType(extension: string): string {
  const typeMap: { [key: string]: string } = {
    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    bmp: "image/bmp",
    webp: "image/webp",
    svg: "image/svg+xml",
    ico: "image/x-icon",
    tif: "image/tiff",
    tiff: "image/tiff",
    avif: "image/avif",

    // Documents
    pdf: "application/pdf",
    txt: "text/plain",
    csv: "text/csv",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    odt: "application/vnd.oasis.opendocument.text",
    ods: "application/vnd.oasis.opendocument.spreadsheet",
    odp: "application/vnd.oasis.opendocument.presentation",
    rtf: "application/rtf",
    md: "text/markdown",

    // Archives
    zip: "application/zip",
    rar: "application/vnd.rar",
    tar: "application/x-tar",
    gz: "application/gzip",
    "7z": "application/x-7z-compressed",

    // Audio
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    m4a: "audio/mp4",
    flac: "audio/flac",
    aac: "audio/aac",

    // Video
    mp4: "video/mp4",
    avi: "video/x-msvideo",
    mov: "video/quicktime",
    mkv: "video/x-matroska",
    webm: "video/webm",
    flv: "video/x-flv",
    wmv: "video/x-ms-wmv",

    // Code & Web
    html: "text/html",
    css: "text/css",
    js: "application/javascript",
    mjs: "application/javascript",
    json: "application/json",
    xml: "application/xml",
    yaml: "text/yaml",
    yml: "text/yaml",
    php: "application/x-httpd-php",
    py: "text/x-python",
    java: "text/x-java-source",
    c: "text/x-c",
    cpp: "text/x-c++",
    h: "text/x-c-header",
    sh: "application/x-sh",
    ts: "application/typescript",
    tsx: "application/typescript",
    jsx: "text/jsx",
    sql: "application/sql",
  };

  return typeMap[extension] || "application/octet-stream";
}
