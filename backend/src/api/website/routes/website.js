const editor = {policies:['global::site-editor']};
module.exports = {routes:[
  {method:'GET',path:'/website/live',handler:'website.live',config:{auth:false}},
  {method:'GET',path:'/website/editor',handler:'website.editor',config:editor},
  {method:'PUT',path:'/website/draft',handler:'website.save',config:editor},
  {method:'POST',path:'/website/publish',handler:'website.publish',config:editor},
  {method:'GET',path:'/website/media',handler:'website.media',config:editor},
  {method:'POST',path:'/website/media',handler:'website.upload',config:editor},
  {method:'GET',path:'/website/inquiries',handler:'website.inquiries',config:editor},
  {method:'POST',path:'/website/inquiries',handler:'website.inquire',config:{auth:false}}
]};
