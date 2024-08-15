
module.exports = _ => {

    const table = _.layer.table || Object.values(_.layer.tables).find(tab => !!tab);

    const geom = _.layer.geom || Object.values(_.layer.geoms).find(tab => !!tab);

    return `
          SELECT
          'bar'
          FROM ${table}
          WHERE ${geom} IS NOT NULL AND ${_.layer.qID} IS NOT NULL \${filter}
          ORDER BY ${_.layer.qID} DESC
          LIMIT 1`
}