"use strict";(()=>{var e={};e.id=908,e.ids=[908],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8320:(e,r,t)=>{t.r(r),t.d(r,{originalPathname:()=>N,patchFetch:()=>E,requestAsyncStorage:()=>p,routeModule:()=>m,serverHooks:()=>l,staticGenerationAsyncStorage:()=>c});var a={};t.r(a),t.d(a,{GET:()=>d});var s=t(9303),i=t(8716),n=t(670),u=t(7070),o=t(728);async function d(e,{params:r}){try{let{simulationId:e}=r;if(!e)return u.NextResponse.json({error:"simulationId is required"},{status:400});let t=await o._.simulation.findUnique({where:{id:e},include:{product:{include:{category:!0,seller:!0}}}});if(!t)return u.NextResponse.json({error:"Simulation not found"},{status:404});let a=await o._.$queryRaw`
      SELECT rating, COUNT(*) as count
      FROM predicted_reviews
      WHERE "simulationId" = ${e}
      GROUP BY rating
      ORDER BY rating
    `,s=await o._.$queryRaw`
      SELECT
        s.name as "segmentName",
        AVG(pr.rating) as "avgRating",
        COUNT(pr.id) as "customerCount",
        SUM(CASE WHEN pr.rating = 1 THEN 1 ELSE 0 END)::float / COUNT(pr.id) * 100 as "star1",
        SUM(CASE WHEN pr.rating = 2 THEN 1 ELSE 0 END)::float / COUNT(pr.id) * 100 as "star2",
        SUM(CASE WHEN pr.rating = 3 THEN 1 ELSE 0 END)::float / COUNT(pr.id) * 100 as "star3",
        SUM(CASE WHEN pr.rating = 4 THEN 1 ELSE 0 END)::float / COUNT(pr.id) * 100 as "star4",
        SUM(CASE WHEN pr.rating = 5 THEN 1 ELSE 0 END)::float / COUNT(pr.id) * 100 as "star5"
      FROM predicted_reviews pr
      JOIN customers c ON pr."customerId" = c.id
      JOIN segments s ON c."segmentId" = s.id
      WHERE pr."simulationId" = ${e}
      GROUP BY s.name
      ORDER BY s.name
    `,i=await o._.$queryRaw`
      SELECT
        FLOOR(similarity * 10) / 10.0 as bucket,
        COUNT(*) as count
      FROM predicted_reviews
      WHERE "simulationId" = ${e}
      GROUP BY bucket
      ORDER BY bucket
    `,n=await o._.$queryRaw`
      SELECT DISTINCT ON (pr.rating)
        pr.rating,
        pr."reviewText",
        pr.similarity,
        s.name as "segmentName"
      FROM predicted_reviews pr
      JOIN customers c ON pr."customerId" = c.id
      JOIN segments s ON c."segmentId" = s.id
      WHERE pr."simulationId" = ${e}
        AND pr."reviewText" IS NOT NULL
      ORDER BY pr.rating, RANDOM()
      LIMIT 10
    `,d=a.reduce((e,r)=>e+Number(r.count),0),m={star1:0,star2:0,star3:0,star4:0,star5:0};for(let{rating:e,count:r}of a){let t=d>0?Number(r)/d*100:0;switch(e){case 1:m.star1=Math.round(100*t)/100;break;case 2:m.star2=Math.round(100*t)/100;break;case 3:m.star3=Math.round(100*t)/100;break;case 4:m.star4=Math.round(100*t)/100;break;case 5:m.star5=Math.round(100*t)/100}}return u.NextResponse.json({simulation:{id:t.id,status:t.status,avgRating:t.avgRating?Number(t.avgRating):null,conversionRate:t.conversionRate?Number(t.conversionRate):null,createdAt:t.createdAt},product:{id:t.product.id,name:t.product.name,description:t.product.description,price:Number(t.product.price),category:t.product.category.name,seller:t.product.seller.name},distribution:m,segments:s.map(e=>({name:e.segmentName,avgRating:Math.round(100*Number(e.avgRating))/100,customerCount:Number(e.customerCount),distribution:{star1:Math.round(100*Number(e.star1))/100,star2:Math.round(100*Number(e.star2))/100,star3:Math.round(100*Number(e.star3))/100,star4:Math.round(100*Number(e.star4))/100,star5:Math.round(100*Number(e.star5))/100}})),similarityDistribution:i.map(e=>({bucket:Number(e.bucket),count:Number(e.count)})),sampleReviews:n.map(e=>({rating:e.rating,reviewText:e.reviewText||"",similarity:Number(e.similarity),segmentName:e.segmentName})),totalReviews:d})}catch(e){return console.error("Results fetch error:",e),u.NextResponse.json({error:"Failed to fetch results",message:e instanceof Error?e.message:"Unknown error"},{status:500})}}let m=new s.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/results/[simulationId]/route",pathname:"/api/results/[simulationId]",filename:"route",bundlePath:"app/api/results/[simulationId]/route"},resolvedPagePath:"C:\\Users\\赤塩甫\\OneDrive\\ドキュメント\\授業\\データベース\\finalapp\\src\\app\\api\\results\\[simulationId]\\route.ts",nextConfigOutput:"",userland:a}),{requestAsyncStorage:p,staticGenerationAsyncStorage:c,serverHooks:l}=m,N="/api/results/[simulationId]/route";function E(){return(0,n.patchFetch)({serverHooks:l,staticGenerationAsyncStorage:c})}},728:(e,r,t)=>{t.d(r,{_:()=>s});let a=require("@prisma/client"),s=global.prisma||new a.PrismaClient({log:["query","error","warn"]})}};var r=require("../../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),a=r.X(0,[276,972],()=>t(8320));module.exports=a})();