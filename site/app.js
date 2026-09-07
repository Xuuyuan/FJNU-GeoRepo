const REPOSITORY = "https://github.com/Xuuyuan/FJNU-GeoRepo";
const RAW_REPOSITORY = "https://raw.githubusercontent.com/Xuuyuan/FJNU-GeoRepo/refs/heads/main";

const searchInput = document.querySelector("#search-input");
const directoryGrid = document.querySelector("#directory-grid");
const fileList = document.querySelector("#file-list");
const resultCount = document.querySelector("#result-count");
const resultUnit = document.querySelector("#result-unit");
const emptyState = document.querySelector("#empty-state");
const breadcrumb = document.querySelector("#breadcrumb");
const directoryHeading = document.querySelector("#directory-heading");
const directoryTitle = document.querySelector("#directory-title");
const directoryGithubLink = document.querySelector("#directory-github-link");
const courseCount = document.querySelector("#course-count");

const collator = new Intl.Collator("zh-CN", { numeric: true, sensitivity: "base" });
let directoryIndex = new Map();
let currentPath = "";

function encodePath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function escapeHtml(value) {
  const entities = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return value.replace(/[&<>"']/g, (character) => entities[character]);
}

function createDirectoryNode(name, path) {
  return {
    name,
    path,
    directories: [],
    files: [],
    totalFiles: 0,
  };
}

function buildDirectoryTree(catalogDirectories) {
  const root = createDirectoryNode("资料库", "");
  directoryIndex = new Map([["", root]]);

  for (const catalogDirectory of catalogDirectories) {
    for (const file of catalogDirectory.files) {
      const parts = file.path.split("/");
      const fileName = parts.pop();
      let node = root;
      const pathParts = [];

      for (const part of parts) {
        pathParts.push(part);
        const directoryPath = pathParts.join("/");
        let child = directoryIndex.get(directoryPath);

        if (!child) {
          child = createDirectoryNode(part, directoryPath);
          directoryIndex.set(directoryPath, child);
          node.directories.push(child);
        }

        node = child;
      }

      node.files.push({
        name: fileName,
        path: file.path,
      });
    }
  }

  function finalize(node) {
    node.directories.sort((left, right) => collator.compare(left.name, right.name));
    node.files.sort((left, right) => collator.compare(left.name, right.name));
    node.totalFiles = node.files.length;

    for (const child of node.directories) {
      finalize(child);
      node.totalFiles += child.totalFiles;
    }
  }

  finalize(root);
}

function createDirectoryCard(directory, index) {
  const number = String(index + 1).padStart(2, "0");
  const directoryName = escapeHtml(directory.name);
  const directoryPath = escapeHtml(directory.path);

  return `
    <button class="directory-card" type="button" data-directory-path="${directoryPath}">
      <span class="directory-index">${number}</span>
      <span class="folder-mark" aria-hidden="true"></span>
      <span class="directory-copy">
        <strong>${directoryName}</strong>
      </span>
      <span class="directory-count">${directory.totalFiles} 个文件</span>
      <i class="directory-arrow" aria-hidden="true">→</i>
    </button>
  `;
}

function createFileRow(file) {
  const fileName = escapeHtml(file.name);
  const encodedPath = encodePath(file.path);
  const viewUrl = `${REPOSITORY}/blob/main/${encodedPath}`;
  const downloadUrl = `${RAW_REPOSITORY}/${encodedPath}`;

  return `
    <article class="file-row">
      <div class="file-copy">
        <h3>${fileName}</h3>
      </div>
      <div class="file-actions">
        <a href="${viewUrl}" target="_blank" rel="noreferrer" aria-label="在 GitHub 查看 ${fileName}">查看 ↗</a>
        <a href="${downloadUrl}" target="_blank" rel="noreferrer" aria-label="从 GitHub 下载 ${fileName}">下载</a>
      </div>
    </article>
  `;
}

function getParentPath(path) {
  const parts = path.split("/").filter(Boolean);
  parts.pop();
  return parts.join("/");
}

function openDirectory(path) {
  if (!directoryIndex.has(path)) {
    return;
  }

  currentPath = path;
  searchInput.value = "";
  searchInput.placeholder = currentPath ? "搜索当前目录……" : "输入课程名称，开始探索……";
  renderLibrary();
}

function renderBreadcrumb() {
  const crumbs = [{ name: "资料库", path: "" }];
  const parts = currentPath.split("/").filter(Boolean);
  const pathParts = [];

  for (const part of parts) {
    pathParts.push(part);
    crumbs.push({ name: part, path: pathParts.join("/") });
  }

  breadcrumb.innerHTML = crumbs
    .map((crumb, index) => {
      const name = escapeHtml(crumb.name);
      const path = escapeHtml(crumb.path);
      const isCurrent = index === crumbs.length - 1;

      if (isCurrent) {
        return `<strong aria-current="page">${name}</strong>`;
      }

      return `<button type="button" data-breadcrumb-path="${path}">${name}</button><span aria-hidden="true">/</span>`;
    })
    .join("");

  breadcrumb.querySelectorAll("[data-breadcrumb-path]").forEach((button) => {
    button.addEventListener("click", () => openDirectory(button.dataset.breadcrumbPath));
  });
}

function showLoadError() {
  directoryGrid.hidden = true;
  fileList.hidden = true;
  directoryHeading.hidden = true;
  emptyState.hidden = false;
  breadcrumb.innerHTML = '<strong aria-current="page">资料库</strong>';
  emptyState.querySelector("h3").textContent = "资料目录加载失败";
  emptyState.querySelector("p").textContent = "请刷新页面后重试。";
  resultCount.textContent = "0";
}

function renderLibrary() {
  const node = directoryIndex.get(currentPath) ?? directoryIndex.get("");
  const query = searchInput.value.trim().toLocaleLowerCase("zh-CN");
  const filteredDirectories = node.directories.filter((directory) =>
    directory.name.toLocaleLowerCase("zh-CN").includes(query),
  );
  const filteredFiles = node.files.filter((file) =>
    file.name.toLocaleLowerCase("zh-CN").includes(query),
  );

  renderBreadcrumb();

  if (currentPath) {
    directoryHeading.hidden = false;
    directoryTitle.textContent = node.name;
    directoryGithubLink.href = `${REPOSITORY}/tree/main/${encodePath(currentPath)}`;
  } else {
    directoryHeading.hidden = true;
    directoryTitle.textContent = "";
    directoryGithubLink.removeAttribute("href");
  }

  directoryGrid.innerHTML = filteredDirectories.map(createDirectoryCard).join("");
  directoryGrid.querySelectorAll(".directory-card").forEach((button) => {
    button.addEventListener("click", () => openDirectory(button.dataset.directoryPath));
  });
  fileList.innerHTML = filteredFiles.map(createFileRow).join("");

  if (!currentPath) {
    resultCount.textContent = String(filteredDirectories.length);
    resultUnit.textContent = " 个一级目录";
  } else {
    resultCount.textContent = String(filteredDirectories.length + filteredFiles.length);
    resultUnit.textContent = ` 项（${filteredDirectories.length} 个目录，${filteredFiles.length} 个文件）`;
  }

  directoryGrid.hidden = filteredDirectories.length === 0;
  fileList.hidden = filteredFiles.length === 0;
  emptyState.hidden = filteredDirectories.length + filteredFiles.length !== 0;
}

async function loadCatalog() {
  try {
    const response = await fetch("./catalog.json", { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const catalog = await response.json();
    buildDirectoryTree(catalog.directories);
    courseCount.textContent = String(catalog.courseCount ?? catalog.directories.length);
    renderLibrary();
  } catch (error) {
    console.error("Failed to load catalog:", error);
    showLoadError();
  }
}

searchInput.addEventListener("input", renderLibrary);

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === "k") {
    event.preventDefault();
    searchInput.focus();
  }

  if (event.key === "Escape") {
    if (searchInput.value) {
      searchInput.value = "";
      renderLibrary();
    } else if (currentPath) {
      openDirectory(getParentPath(currentPath));
    }
  }
});

loadCatalog();
