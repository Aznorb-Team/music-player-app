import { bootstrapApplication, BootstrapContext } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeRu from '@angular/common/locales/ru';
import { App } from './app/app';
import { config } from './app/app.config.server';

registerLocaleData(localeRu);

const bootstrap = (context: BootstrapContext) => bootstrapApplication(App, config, context);
export default bootstrap;
