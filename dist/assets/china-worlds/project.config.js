export default {
 name:'chongqing',title:'Chongqing',subtitle:'Mountain streets · River lights',seed:270197,
 terrain:{width:69.6,depth:52.2,thickness:3.2,surface:'plaza',relief:0},
 camera:{position:[69.6,55.1,82.65],target:[0,8.7,0],viewHeight:68,minZoom:.6,maxZoom:3.4,minPolarAngle:.28,maxPolarAngle:1.35,autoRotate:true,autoRotateSpeed:.045},
 lighting:{night:false,default:'day',windowLitRate:.73,bloom:.18,exposure:1.05,dayBackground:'#b9d1d3',nightBackground:'#17283e'},
 visual:{palette:{'#915e3a':'#805a40','#c3945c':'#b58b5a','#e48b2f':'#cb905b','#65853d':'#6f8461','#91a746':'#8d9c70','#456733':'#466b54'},fontFamily:'"PingFang SC","Microsoft YaHei",Arial,sans-serif',outlineOpacity:.17,pixelRatio:1.6,shadows:true},
 weather:{preset:'clear',wind:.25,rainCount:0},people:{count:48,economyCount:48,speedScale:.82},
 traffic:{count:24,speedScale:.75,signals:false,signalPlan:[['LOOP',10],['PED',7]],labels:{bus:'重庆公交',route:'T480',delivery:'山城配送'}}
};
