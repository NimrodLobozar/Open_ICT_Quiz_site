// Eén plek voor kleuren en fonts (antd ConfigProvider).
// Pas kleuren HIER aan, niet per component. Zie https://ant.design/docs/react/customize-theme
export const theme = {
  token: {
    colorPrimary: '#5b3cc4',
    colorInfo: '#5b3cc4',
    borderRadius: 10,
    fontSize: 16,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  components: {
    Layout: {
      headerBg: '#5b3cc4',
      bodyBg: '#f5f3ff',
    },
  },
}

// Kleuren voor de antwoordknoppen (zoals bij Kahoot: elke optie een eigen kleur).
export const answerColors = ['#e21b3c', '#1368ce', '#d89e00', '#26890c']

// TODO(team, idee): donker thema voor het digibord (zie docs/IDEEEN.md).
