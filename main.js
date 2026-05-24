const state = {
  keyword: ''
}

const data = window.guideData

const els = {
  title: document.querySelector('#app-title'),
  schoolShortName: document.querySelector('#school-short-name'),
  schoolSubtitle: document.querySelector('#school-subtitle'),
  schoolIntro: document.querySelector('#school-intro'),
  tagList: document.querySelector('#tag-list'),
  noticeList: document.querySelector('#notice-list'),
  categoryList: document.querySelector('#category-list'),
  resultCount: document.querySelector('#result-count'),
  searchInput: document.querySelector('#search-input'),
  detailPanel: document.querySelector('#detail-panel'),
  detailBackdrop: document.querySelector('#detail-backdrop'),
  closeDetail: document.querySelector('#close-detail'),
  detailKicker: document.querySelector('#detail-kicker'),
  detailTitle: document.querySelector('#detail-title'),
  detailDesc: document.querySelector('#detail-desc'),
  detailDate: document.querySelector('#detail-date'),
  detailContent: document.querySelector('#detail-content'),
  helpButton: document.querySelector('#edit-help-button'),
  helpPanel: document.querySelector('#help-panel'),
  helpBackdrop: document.querySelector('#help-backdrop'),
  closeHelp: document.querySelector('#close-help')
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function contentItemText(item) {
  if (typeof item === 'string') return item
  return `${item.text || ''}${item.caption || ''}${item.alt || ''}`
}

function renderContentItem(item) {
  if (typeof item === 'string') {
    return `<p>${escapeHtml(item)}</p>`
  }

  if (item.type === 'heading') {
    return `<h3>${escapeHtml(item.text)}</h3>`
  }

  if (item.type === 'image') {
    const caption = item.caption ? `<figcaption>${escapeHtml(item.caption)}</figcaption>` : ''
    return `
      <figure class="content-image">
        <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt || item.caption || '')}" loading="lazy" />
        ${caption}
      </figure>
    `
  }

  return ''
}

function getFilteredCategories() {
  const keyword = state.keyword.trim()
  if (!keyword) return data.categories

  return data.categories
    .map((category) => {
      const articles = category.articles.filter((article) => {
        const body = article.content.map(contentItemText).join('')
        const text = `${category.name}${category.summary}${article.title}${article.desc}${body}`
        return text.includes(keyword)
      })

      const categoryMatched = `${category.name}${category.summary}`.includes(keyword)
      return categoryMatched ? category : { ...category, articles }
    })
    .filter((category) => category.articles.length > 0 || `${category.name}${category.summary}`.includes(keyword))
}

function renderSchool() {
  const { school } = data
  document.title = school.title
  els.title.textContent = school.title
  els.schoolShortName.textContent = school.shortName
  els.schoolSubtitle.textContent = school.subtitle
  els.schoolIntro.textContent = school.intro
  els.tagList.innerHTML = school.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')
}

function renderNotices() {
  els.noticeList.innerHTML = data.notices
    .map(
      (notice) => `
        <article class="notice-card card">
          <div class="notice-tag">${escapeHtml(notice.tag)}</div>
          <div>
            <h3>${escapeHtml(notice.title)}</h3>
            <p>${escapeHtml(notice.text)}</p>
          </div>
        </article>
      `
    )
    .join('')
}

function renderCategories() {
  const categories = getFilteredCategories()
  const articleCount = categories.reduce((sum, category) => sum + category.articles.length, 0)
  els.resultCount.textContent = state.keyword ? `${articleCount} 条结果` : `${data.categories.length} 个分类`

  if (categories.length === 0) {
    els.categoryList.innerHTML = '<div class="empty-card card">没有找到相关内容</div>'
    return
  }

  els.categoryList.innerHTML = categories
    .map(
      (category) => `
        <article class="category-card card" data-category-id="${escapeHtml(category.id)}">
          <div class="category-icon" style="color: ${category.color}; background: ${category.bgColor};">
            ${escapeHtml(category.icon)}
          </div>
          <div class="category-copy">
            <div class="category-line">
              <h3>${escapeHtml(category.name)}</h3>
              <span>${category.articles.length} 篇</span>
            </div>
            <p>${escapeHtml(category.summary)}</p>
            <div class="article-chips">
              ${category.articles
                .map(
                  (article) => `
                    <button type="button" data-category-id="${escapeHtml(category.id)}" data-article-id="${escapeHtml(article.id)}">
                      ${escapeHtml(article.title)}
                    </button>
                  `
                )
                .join('')}
            </div>
          </div>
        </article>
      `
    )
    .join('')
}

function findArticle(categoryId, articleId) {
  const category = data.categories.find((item) => item.id === categoryId)
  if (!category) return null

  const article = category.articles.find((item) => item.id === articleId)
  if (!article) return null

  return { category, article }
}

function openArticle(categoryId, articleId) {
  const result = findArticle(categoryId, articleId)
  if (!result) return

  const { category, article } = result
  els.detailKicker.textContent = category.name
  els.detailKicker.style.color = category.color
  els.detailTitle.textContent = article.title
  els.detailDesc.textContent = article.desc
  els.detailDate.textContent = `更新：${article.updatedAt}`
  els.detailContent.innerHTML = article.content.map(renderContentItem).join('')
  els.detailPanel.classList.add('is-open')
  els.detailPanel.setAttribute('aria-hidden', 'false')
}

function closeArticle() {
  els.detailPanel.classList.remove('is-open')
  els.detailPanel.setAttribute('aria-hidden', 'true')
}

function openHelp() {
  els.helpPanel.classList.add('is-open')
  els.helpPanel.setAttribute('aria-hidden', 'false')
}

function closeHelp() {
  els.helpPanel.classList.remove('is-open')
  els.helpPanel.setAttribute('aria-hidden', 'true')
}

function bindEvents() {
  els.searchInput.addEventListener('input', (event) => {
    state.keyword = event.target.value
    renderCategories()
  })

  els.categoryList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-article-id]')
    if (!button) return
    openArticle(button.dataset.categoryId, button.dataset.articleId)
  })

  els.closeDetail.addEventListener('click', closeArticle)
  els.detailBackdrop.addEventListener('click', closeArticle)
  els.helpButton.addEventListener('click', openHelp)
  els.closeHelp.addEventListener('click', closeHelp)
  els.helpBackdrop.addEventListener('click', closeHelp)

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeArticle()
      closeHelp()
    }
  })
}

renderSchool()
renderNotices()
renderCategories()
bindEvents()
