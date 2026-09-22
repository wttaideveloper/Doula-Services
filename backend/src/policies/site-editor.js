module.exports = async (ctx, config, { strapi }) => {
  if (!ctx.state.user) return false;
  const user = await strapi.db.query('plugin::users-permissions.user').findOne({where:{id:ctx.state.user.id},populate:['role']});
  return !!user && !user.blocked && user.role?.type === 'site-editor';
};
