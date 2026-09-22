const defaults=require('../../content/defaults.json');
module.exports={
  register(){},
  async bootstrap({strapi}){
    const store=strapi.store({type:'plugin',name:'users-permissions'});
    const advanced=await store.get({key:'advanced'});
    await store.set({key:'advanced',value:{...advanced,allow_register:false}});
    let role=await strapi.db.query('plugin::users-permissions.role').findOne({where:{type:'site-editor'}});
    if(!role)role=await strapi.db.query('plugin::users-permissions.role').create({data:{name:'Website Editor',description:'Edit, preview and publish website content',type:'site-editor'}});
    for(const action of ['editor','save','publish','media','upload','inquiries']){
      const name=`api::website.website.${action}`;
      const existing=await strapi.db.query('plugin::users-permissions.permission').findOne({where:{action:name,role:role.id}});
      if(!existing)await strapi.db.query('plugin::users-permissions.permission').create({data:{action:name,role:role.id}});
    }
    const email=process.env.EDITOR_EMAIL;
    if(email&&process.env.EDITOR_PASSWORD){
      const exists=await strapi.db.query('plugin::users-permissions.user').findOne({where:{email:email.toLowerCase()}});
      if(!exists){if(process.env.EDITOR_PASSWORD.length<14)throw new Error('EDITOR_PASSWORD must have at least 14 characters');await strapi.plugin('users-permissions').service('user').add({username:'Website owner',email:email.toLowerCase(),password:process.env.EDITOR_PASSWORD,provider:'local',confirmed:true,blocked:false,role:role.id});}
    }
    if(!await strapi.db.query('api::website.website').findOne({}))await strapi.db.query('api::website.website').create({data:{draft:defaults,live:defaults,revision:1,liveRevision:1,publishedOn:new Date().toISOString()}});
  }
};
