export const isDev = process.env.NODE_ENV === 'development'
export const isProduction = !isDev

export const config = {
    isDev,
    isProduction,
    port: process.env.PORT || 12345,
    app: {
        name: "Nekomiya App",
        version: "1.0.0",
    },
    window: {
        main: {
            initWidth: 800,
            initHeight: 600,
            minWidth: 800,
            minHeight: 600,
            maxWidth: 3840,
            maxHeight: 2160,
        }
    },
    setting: {
        
    }
}
