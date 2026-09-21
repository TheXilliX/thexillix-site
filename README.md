# TheXilliX — V1

Первая интерактивная версия персонального сайта TheXilliX.

## Локальный запуск

```bash
npm install
npm run dev
```

## Сборка

```bash
npm run build
```

После отправки изменений в ветку `main` workflow `.github/workflows/deploy.yml`
собирает проект и публикует папку `dist` через GitHub Pages.

В настройках репозитория нужно один раз выбрать:
`Settings → Pages → Build and deployment → Source → GitHub Actions`.
