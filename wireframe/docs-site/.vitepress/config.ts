import { defineConfig } from 'vitepress'

const appUrl = 'https://yarsuleimenov-code.github.io/Mobile_app/'

const ruSidebar = [
  {
    text: 'Начало работы',
    items: [
      { text: 'Обзор документации', link: '/ru/' },
      { text: 'Быстрый старт', link: '/ru/quick-start' },
      { text: 'Полное руководство', link: '/ru/user-guide' },
    ],
  },
  {
    text: 'Операции',
    items: [
      { text: 'Первое знакомство', link: '/ru/knowledge-base/getting-started' },
      { text: 'Pickup', link: '/ru/knowledge-base/pickup' },
      { text: 'Dropoff', link: '/ru/knowledge-base/dropoff' },
      { text: 'Same Day', link: '/ru/knowledge-base/same-day' },
      { text: 'Scan и Cargo', link: '/ru/knowledge-base/scan-and-cargo' },
      {
        text: 'Interstate и BOL/eBOL',
        link: '/ru/knowledge-base/interstate-and-bol',
      },
    ],
  },
  {
    text: 'Для команды проекта',
    collapsed: true,
    items: [{ text: 'Бизнес-обзор', link: '/ru/business-overview' }],
  },
]

const enSidebar = [
  {
    text: 'Getting started',
    items: [
      { text: 'Documentation overview', link: '/en/' },
      { text: 'Quick Start', link: '/en/quick-start' },
      { text: 'Full User Guide', link: '/en/user-guide' },
    ],
  },
  {
    text: 'Operations',
    items: [
      { text: 'Getting Started', link: '/en/knowledge-base/getting-started' },
      { text: 'Pickup', link: '/en/knowledge-base/pickup' },
      { text: 'Dropoff', link: '/en/knowledge-base/dropoff' },
      { text: 'Same Day', link: '/en/knowledge-base/same-day' },
      { text: 'Scan and Cargo', link: '/en/knowledge-base/scan-and-cargo' },
      {
        text: 'Interstate and BOL/eBOL',
        link: '/en/knowledge-base/interstate-and-bol',
      },
    ],
  },
  {
    text: 'For the project team',
    collapsed: true,
    items: [{ text: 'Business Overview', link: '/en/business-overview' }],
  },
]

export default defineConfig({
  base: '/Mobile_app/help/',
  srcDir: './content',
  outDir: '../dist/help',
  cleanUrls: true,
  lastUpdated: true,
  title: 'Zaberman Mobile App',
  description: 'Mobile App user guide and knowledge base',
  locales: {
    root: {
      label: 'Language',
      lang: 'en-US',
      title: 'Zaberman Mobile App Help',
      themeConfig: {
        nav: [
          { text: 'Русский', link: '/ru/' },
          { text: 'English', link: '/en/' },
          { text: 'Open Mobile App', link: appUrl },
        ],
      },
    },
    ru: {
      label: 'Русский',
      lang: 'ru-RU',
      link: '/ru/',
      title: 'Zaberman Mobile App',
      description: 'Руководство пользователя и база знаний',
      themeConfig: {
        nav: [
          { text: 'Инструкция', link: '/ru/' },
          { text: 'Быстрый старт', link: '/ru/quick-start' },
          {
            text: 'Операции',
            items: [
              { text: 'Pickup', link: '/ru/knowledge-base/pickup' },
              { text: 'Dropoff', link: '/ru/knowledge-base/dropoff' },
              { text: 'Same Day', link: '/ru/knowledge-base/same-day' },
              { text: 'Scan и Cargo', link: '/ru/knowledge-base/scan-and-cargo' },
              {
                text: 'Interstate и BOL/eBOL',
                link: '/ru/knowledge-base/interstate-and-bol',
              },
            ],
          },
          { text: 'English', link: '/en/' },
          { text: 'Открыть приложение', link: appUrl },
        ],
        sidebar: ruSidebar,
        outlineTitle: 'На странице',
        docFooter: {
          prev: 'Предыдущая страница',
          next: 'Следующая страница',
        },
        lastUpdatedText: 'Обновлено',
        darkModeSwitchLabel: 'Тема',
        sidebarMenuLabel: 'Меню',
        returnToTopLabel: 'Наверх',
        langMenuLabel: 'Выбрать язык',
      },
    },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      title: 'Zaberman Mobile App',
      description: 'User guide and knowledge base',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/en/' },
          { text: 'Quick Start', link: '/en/quick-start' },
          {
            text: 'Operations',
            items: [
              { text: 'Pickup', link: '/en/knowledge-base/pickup' },
              { text: 'Dropoff', link: '/en/knowledge-base/dropoff' },
              { text: 'Same Day', link: '/en/knowledge-base/same-day' },
              { text: 'Scan and Cargo', link: '/en/knowledge-base/scan-and-cargo' },
              {
                text: 'Interstate and BOL/eBOL',
                link: '/en/knowledge-base/interstate-and-bol',
              },
            ],
          },
          { text: 'Русский', link: '/ru/' },
          { text: 'Open Mobile App', link: appUrl },
        ],
        sidebar: enSidebar,
      },
    },
  },
  themeConfig: {
    search: {
      provider: 'local',
    },
    outline: {
      level: [2, 3],
    },
    footer: {
      message: 'Zaberman Mobile App documentation',
    },
  },
})
