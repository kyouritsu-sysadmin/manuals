const catalog = require("../src/data/catalog.json");
module.exports = function libraryPlugin(context) {
  return {
    name: "division-library",
    async contentLoaded({ actions }) {
      for (const division of catalog.divisions) {
        for (const category of [null, ...catalog.categories]) {
          const suffix = category ? `${category.slug}/` : "";
          const data = await actions.createData(
            `${division.slug}-${category?.slug || "index"}.json`,
            JSON.stringify({
              division: division.slug,
              category: category?.slug || null,
            }),
          );
          actions.addRoute({
            path: `${context.baseUrl}${division.slug}/${suffix}`,
            exact: true,
            component: "@site/src/templates/Division.tsx",
            modules: { selection: data },
          });
        }
      }
    },
  };
};
