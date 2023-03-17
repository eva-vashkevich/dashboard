"use strict";(self.webpackChunkrancher_ui_devkit=self.webpackChunkrancher_ui_devkit||[]).push([[5808],{3905:(e,t,n)=>{n.d(t,{Zo:()=>d,kt:()=>m});var r=n(7294);function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function s(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){a(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function i(e,t){if(null==e)return{};var n,r,a=function(e,t){if(null==e)return{};var n,r,a={},o=Object.keys(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||(a[n]=e[n]);return a}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(a[n]=e[n])}return a}var l=r.createContext({}),c=function(e){var t=r.useContext(l),n=t;return e&&(n="function"==typeof e?e(t):s(s({},t),e)),n},d=function(e){var t=c(e.components);return r.createElement(l.Provider,{value:t},e.children)},p={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},u=r.forwardRef((function(e,t){var n=e.components,a=e.mdxType,o=e.originalType,l=e.parentName,d=i(e,["components","mdxType","originalType","parentName"]),u=c(n),m=a,f=u["".concat(l,".").concat(m)]||u[m]||p[m]||o;return n?r.createElement(f,s(s({ref:t},d),{},{components:n})):r.createElement(f,s({ref:t},d))}));function m(e,t){var n=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var o=n.length,s=new Array(o);s[0]=u;var i={};for(var l in t)hasOwnProperty.call(t,l)&&(i[l]=t[l]);i.originalType=e,i.mdxType="string"==typeof e?e:a,s[1]=i;for(var c=2;c<o;c++)s[c]=n[c];return r.createElement.apply(null,s)}return r.createElement.apply(null,n)}u.displayName="MDXCreateElement"},7465:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>l,contentTitle:()=>s,default:()=>p,frontMatter:()=>o,metadata:()=>i,toc:()=>c});var r=n(7462),a=(n(7294),n(3905));const o={},s="Style and Format",i={unversionedId:"code-base-works/style",id:"code-base-works/style",title:"Style and Format",description:"SCSS",source:"@site/docs/code-base-works/style.md",sourceDirName:"code-base-works",slug:"/code-base-works/style",permalink:"/dashboard/code-base-works/style",draft:!1,tags:[],version:"current",lastUpdatedAt:1679069606,formattedLastUpdatedAt:"Mar 17, 2023",frontMatter:{},sidebar:"mainSidebar",previous:{title:"On-screen Text and Translations",permalink:"/dashboard/code-base-works/on-screen-text-and-translations"},next:{title:"Introduction",permalink:"/dashboard/extensions/introduction"}},l={},c=[{value:"SCSS",id:"scss",level:2},{value:"Date",id:"date",level:2},{value:"Loading Indicator",id:"loading-indicator",level:2}],d={toc:c};function p(e){let{components:t,...n}=e;return(0,a.kt)("wrapper",(0,r.Z)({},d,n,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("h1",{id:"style-and-format"},"Style and Format"),(0,a.kt)("h2",{id:"scss"},"SCSS"),(0,a.kt)("p",null,"SCSS Styles can be found in ",(0,a.kt)("inlineCode",{parentName:"p"},"assets/styles/"),". It's recommended to browse through some of the common styles in ",(0,a.kt)("inlineCode",{parentName:"p"},"_helpers.scss")," and ",(0,a.kt)("inlineCode",{parentName:"p"},"_mixins.scss"),"."),(0,a.kt)("h2",{id:"date"},"Date"),(0,a.kt)("p",null,"The Dashboard uses the ",(0,a.kt)("a",{parentName:"p",href:"https://day.js.org/"},"dayjs")," library to handle dates, times and date algebra. However when showing a date and time they should take into account the date and time format. Therefore it's advised to use a formatter such as ",(0,a.kt)("inlineCode",{parentName:"p"},"/components/formatter/Date.vue")," to display them."),(0,a.kt)("h2",{id:"loading-indicator"},"Loading Indicator"),(0,a.kt)("p",null,"When a component uses ",(0,a.kt)("inlineCode",{parentName:"p"},"async fetch")," it's best practise to gate the component template on fetch's ",(0,a.kt)("inlineCode",{parentName:"p"},"$fetchState.pending"),". When the component is page based this should be applied to the ",(0,a.kt)("inlineCode",{parentName:"p"},"/components/Loading")," component"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-html"},'<template>\n  <Loading v-if="$fetchState.pending" />\n  <div v-else>\n    ...\n  </div>\n</template>\n')))}p.isMDXComponent=!0}}]);