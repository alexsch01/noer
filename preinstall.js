if(!!process.env.npm_config_global) {
    console.log('This npm module cannot be installed globally')
    process.exit(1)
}
