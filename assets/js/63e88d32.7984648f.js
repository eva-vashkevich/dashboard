"use strict";(self.webpackChunkrancher_ui_devkit=self.webpackChunkrancher_ui_devkit||[]).push([[231],{3905:(e,t,n)=>{n.d(t,{Zo:()=>p,kt:()=>m});var r=n(7294);function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function a(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?a(Object(n),!0).forEach((function(t){o(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):a(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,r,o=function(e,t){if(null==e)return{};var n,r,o={},a=Object.keys(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}var s=r.createContext({}),c=function(e){var t=r.useContext(s),n=t;return e&&(n="function"==typeof e?e(t):i(i({},t),e)),n},p=function(e){var t=c(e.components);return r.createElement(s.Provider,{value:t},e.children)},u={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},d=r.forwardRef((function(e,t){var n=e.components,o=e.mdxType,a=e.originalType,s=e.parentName,p=l(e,["components","mdxType","originalType","parentName"]),d=c(n),m=o,h=d["".concat(s,".").concat(m)]||d[m]||u[m]||a;return n?r.createElement(h,i(i({ref:t},p),{},{components:n})):r.createElement(h,i({ref:t},p))}));function m(e,t){var n=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var a=n.length,i=new Array(a);i[0]=d;var l={};for(var s in t)hasOwnProperty.call(t,s)&&(l[s]=t[s]);l.originalType=e,l.mdxType="string"==typeof e?e:o,i[1]=l;for(var c=2;c<a;c++)i[c]=n[c];return r.createElement.apply(null,i)}return r.createElement.apply(null,n)}d.displayName="MDXCreateElement"},2471:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>s,contentTitle:()=>i,default:()=>u,frontMatter:()=>a,metadata:()=>l,toc:()=>c});var r=n(7462),o=(n(7294),n(3905));const a={},i="Introduction",l={unversionedId:"extensions/introduction",id:"extensions/introduction",title:"Introduction",description:"Rancher Extensions provides a mechanism to add new functionality to the Dashboard UI at runtime.",source:"@site/docs/extensions/introduction.md",sourceDirName:"extensions",slug:"/extensions/introduction",permalink:"/dashboard/extensions/introduction",draft:!1,tags:[],version:"current",lastUpdatedAt:1680000274,formattedLastUpdatedAt:"Mar 28, 2023",frontMatter:{},sidebar:"mainSidebar",previous:{title:"Style and Format",permalink:"/dashboard/code-base-works/style"},next:{title:"Getting Started",permalink:"/dashboard/extensions/extensions-getting-started"}},s={},c=[{value:"Overview",id:"overview",level:2}],p={toc:c};function u(e){let{components:t,...n}=e;return(0,o.kt)("wrapper",(0,r.Z)({},p,n,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("h1",{id:"introduction"},"Introduction"),(0,o.kt)("p",null,"Rancher Extensions provides a mechanism to add new functionality to the Dashboard UI at runtime."),(0,o.kt)("p",null,"Extensions can be created independently of Rancher and their code can live in separate GitHub repositories. They are compiled as ",(0,o.kt)("a",{parentName:"p",href:"https://vuejs.org/"},"Vue")," libraries and packaged\nup with a simple Helm chart to allow easy installation into Rancher."),(0,o.kt)("p",null,"You can find some example extensions here: ",(0,o.kt)("a",{parentName:"p",href:"https://github.com/rancher/ui-plugin-examples"},"https://github.com/rancher/ui-plugin-examples")),(0,o.kt)("blockquote",null,(0,o.kt)("p",{parentName:"blockquote"},"Note: Rancher Extensions is in early development - support for Extensions was recently added to Rancher 2.7.0 and the internal Rancher team is building out\nextensions using the extensions framework. Over time, the extensions API will improve and the supporting documentation will be built out, to enable\nthe wider developer community to build their own extensions.")),(0,o.kt)("h2",{id:"overview"},"Overview"),(0,o.kt)("p",null,"A Rancher Extension is a packaged Vue library that provides a set of functionality to extend and enhance the Rancher UI."),(0,o.kt)("p",null,"Developers can author, release and maintain extensions independently of Rancher itself."),(0,o.kt)("p",null,"Rancher defines a number of extension points which developers can take advantage of, to provide extra functionality, for example:"),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},"Ability to add new locales and localization packs"),(0,o.kt)("li",{parentName:"ul"},"Ability to add support for custom CRDs"),(0,o.kt)("li",{parentName:"ul"},"Ability to add new UI screens to the top-level side navigation"),(0,o.kt)("li",{parentName:"ul"},"Ability to customize the landing page")),(0,o.kt)("blockquote",null,(0,o.kt)("p",{parentName:"blockquote"},"Note: More extension points will be added over time")),(0,o.kt)("p",null,"Once an extension has been authored, it can be packaged up into a Helm chart, added to a Helm repository and then easily installed into a running Rancher system."))}u.isMDXComponent=!0}}]);