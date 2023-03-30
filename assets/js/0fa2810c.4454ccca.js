"use strict";(self.webpackChunkrancher_ui_devkit=self.webpackChunkrancher_ui_devkit||[]).push([[4947],{3905:(e,t,r)=>{r.d(t,{Zo:()=>u,kt:()=>m});var n=r(7294);function o(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function a(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function s(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?a(Object(r),!0).forEach((function(t){o(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):a(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function i(e,t){if(null==e)return{};var r,n,o=function(e,t){if(null==e)return{};var r,n,o={},a=Object.keys(e);for(n=0;n<a.length;n++)r=a[n],t.indexOf(r)>=0||(o[r]=e[r]);return o}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(n=0;n<a.length;n++)r=a[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(o[r]=e[r])}return o}var c=n.createContext({}),p=function(e){var t=n.useContext(c),r=t;return e&&(r="function"==typeof e?e(t):s(s({},t),e)),r},u=function(e){var t=p(e.components);return n.createElement(c.Provider,{value:t},e.children)},l={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},d=n.forwardRef((function(e,t){var r=e.components,o=e.mdxType,a=e.originalType,c=e.parentName,u=i(e,["components","mdxType","originalType","parentName"]),d=p(r),m=o,b=d["".concat(c,".").concat(m)]||d[m]||l[m]||a;return r?n.createElement(b,s(s({ref:t},u),{},{components:r})):n.createElement(b,s({ref:t},u))}));function m(e,t){var r=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var a=r.length,s=new Array(a);s[0]=d;var i={};for(var c in t)hasOwnProperty.call(t,c)&&(i[c]=t[c]);i.originalType=e,i.mdxType="string"==typeof e?e:o,s[1]=i;for(var p=2;p<a;p++)s[p]=r[p];return n.createElement.apply(null,s)}return n.createElement.apply(null,r)}d.displayName="MDXCreateElement"},1222:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>c,contentTitle:()=>s,default:()=>l,frontMatter:()=>a,metadata:()=>i,toc:()=>p});var n=r(7462),o=(r(7294),r(3905));const a={},s="Keyboard shortcuts",i={unversionedId:"code-base-works/keyboard-shortcuts",id:"code-base-works/keyboard-shortcuts",title:"Keyboard shortcuts",description:"Shortcuts are implemented via vue-shortkey",source:"@site/docs/code-base-works/keyboard-shortcuts.md",sourceDirName:"code-base-works",slug:"/code-base-works/keyboard-shortcuts",permalink:"/dashboard/code-base-works/keyboard-shortcuts",draft:!1,tags:[],version:"current",lastUpdatedAt:1680192235,formattedLastUpdatedAt:"Mar 30, 2023",frontMatter:{},sidebar:"mainSidebar",previous:{title:"Helm Chart Apps",permalink:"/dashboard/code-base-works/helm-chart-apps"},next:{title:"Kubernetes Resources Data Load Optimizations",permalink:"/dashboard/code-base-works/kubernetes-resources-data-load"}},c={},p=[],u={toc:p};function l(e){let{components:t,...r}=e;return(0,o.kt)("wrapper",(0,n.Z)({},u,r,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("h1",{id:"keyboard-shortcuts"},"Keyboard shortcuts"),(0,o.kt)("p",null,"Shortcuts are implemented via ",(0,o.kt)("a",{parentName:"p",href:"https://github.com/iFgR/vue-shortkey"},(0,o.kt)("inlineCode",{parentName:"a"},"vue-shortkey"))),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-html"},'<button v-shortkey.once="[\'n\']" class="hide" @shortkey="focus()" />\n')),(0,o.kt)("p",null,"Configuration for this is in ",(0,o.kt)("inlineCode",{parentName:"p"},"plugins/shortkey.js"),". At the time of writing this contains options to disable keyboard shortcuts in ",(0,o.kt)("inlineCode",{parentName:"p"},"input"),", ",(0,o.kt)("inlineCode",{parentName:"p"},"textarea")," and ",(0,o.kt)("inlineCode",{parentName:"p"},"select")," elements."))}l.isMDXComponent=!0}}]);