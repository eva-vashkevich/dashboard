"use strict";(self.webpackChunkrancher_ui_devkit=self.webpackChunkrancher_ui_devkit||[]).push([[7861],{3905:(e,n,t)=>{t.d(n,{Zo:()=>u,kt:()=>f});var r=t(7294);function a(e,n,t){return n in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function o(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);n&&(r=r.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),t.push.apply(t,r)}return t}function i(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{};n%2?o(Object(t),!0).forEach((function(n){a(e,n,t[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):o(Object(t)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))}))}return e}function c(e,n){if(null==e)return{};var t,r,a=function(e,n){if(null==e)return{};var t,r,a={},o=Object.keys(e);for(r=0;r<o.length;r++)t=o[r],n.indexOf(t)>=0||(a[t]=e[t]);return a}(e,n);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)t=o[r],n.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(a[t]=e[t])}return a}var s=r.createContext({}),l=function(e){var n=r.useContext(s),t=n;return e&&(t="function"==typeof e?e(n):i(i({},n),e)),t},u=function(e){var n=l(e.components);return r.createElement(s.Provider,{value:n},e.children)},p={inlineCode:"code",wrapper:function(e){var n=e.children;return r.createElement(r.Fragment,{},n)}},d=r.forwardRef((function(e,n){var t=e.components,a=e.mdxType,o=e.originalType,s=e.parentName,u=c(e,["components","mdxType","originalType","parentName"]),d=l(t),f=a,g=d["".concat(s,".").concat(f)]||d[f]||p[f]||o;return t?r.createElement(g,i(i({ref:n},u),{},{components:t})):r.createElement(g,i({ref:n},u))}));function f(e,n){var t=arguments,a=n&&n.mdxType;if("string"==typeof e||a){var o=t.length,i=new Array(o);i[0]=d;var c={};for(var s in n)hasOwnProperty.call(n,s)&&(c[s]=n[s]);c.originalType=e,c.mdxType="string"==typeof e?e:a,i[1]=c;for(var l=2;l<o;l++)i[l]=t[l];return r.createElement.apply(null,i)}return r.createElement.apply(null,t)}d.displayName="MDXCreateElement"},7172:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>s,contentTitle:()=>i,default:()=>p,frontMatter:()=>o,metadata:()=>c,toc:()=>l});var r=t(7462),a=(t(7294),t(3905));const o={},i="Package Management",c={unversionedId:"guide/package-management",id:"guide/package-management",title:"Package Management",description:"NPM Package dependencies can be found in the usual ./package.json file. There is also ./yarn.lock which fixes referenced dependency's versions.",source:"@site/docs/guide/package-management.md",sourceDirName:"guide",slug:"/guide/package-management",permalink:"/dashboard/guide/package-management",draft:!1,tags:[],version:"current",lastUpdatedAt:1680192235,formattedLastUpdatedAt:"Mar 30, 2023",frontMatter:{},sidebar:"mainSidebar",previous:{title:"Building an Image for Container Registries",permalink:"/dashboard/guide/build-for-container-registry"},next:{title:"Auth Providers",permalink:"/dashboard/guide/auth-providers"}},s={},l=[],u={toc:l};function p(e){let{components:n,...t}=e;return(0,a.kt)("wrapper",(0,r.Z)({},u,t,{components:n,mdxType:"MDXLayout"}),(0,a.kt)("h1",{id:"package-management"},"Package Management"),(0,a.kt)("p",null,"NPM Package dependencies can be found in the usual ",(0,a.kt)("inlineCode",{parentName:"p"},"./package.json")," file. There is also ",(0,a.kt)("inlineCode",{parentName:"p"},"./yarn.lock")," which fixes referenced dependency's versions."),(0,a.kt)("p",null,"Changes to these files should be kept to a minimum to avoid regression for seldom used features (caused by newer dependencies changing and breaking them)."),(0,a.kt)("p",null,"Changes to ",(0,a.kt)("inlineCode",{parentName:"p"},"./yarn.lock")," should be reviewed carefully, specifically to ensure no rogue dependency url is introduced."))}p.isMDXComponent=!0}}]);