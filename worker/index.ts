interface Environment {
  ASSETS: Fetcher;
}

export default {
  fetch(request, environment) {
    return environment.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Environment>;
