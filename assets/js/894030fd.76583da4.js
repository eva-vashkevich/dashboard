"use strict";(self.webpackChunkrancher_ui_devkit=self.webpackChunkrancher_ui_devkit||[]).push([[818],{3905:(e,t,n)=>{n.d(t,{Zo:()=>c,kt:()=>p});var a=n(7294);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function s(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function o(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?s(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):s(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function i(e,t){if(null==e)return{};var n,a,r=function(e,t){if(null==e)return{};var n,a,r={},s=Object.keys(e);for(a=0;a<s.length;a++)n=s[a],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var s=Object.getOwnPropertySymbols(e);for(a=0;a<s.length;a++)n=s[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var l=a.createContext({}),u=function(e){var t=a.useContext(l),n=t;return e&&(n="function"==typeof e?e(t):o(o({},t),e)),n},c=function(e){var t=u(e.components);return a.createElement(l.Provider,{value:t},e.children)},h={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},d=a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,s=e.originalType,l=e.parentName,c=i(e,["components","mdxType","originalType","parentName"]),d=u(n),p=r,m=d["".concat(l,".").concat(p)]||d[p]||h[p]||s;return n?a.createElement(m,o(o({ref:t},c),{},{components:n})):a.createElement(m,o({ref:t},c))}));function p(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var s=n.length,o=new Array(s);o[0]=d;var i={};for(var l in t)hasOwnProperty.call(t,l)&&(i[l]=t[l]);i.originalType=e,i.mdxType="string"==typeof e?e:r,o[1]=i;for(var u=2;u<s;u++)o[u]=n[u];return a.createElement.apply(null,o)}return a.createElement.apply(null,n)}d.displayName="MDXCreateElement"},3589:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>l,contentTitle:()=>o,default:()=>h,frontMatter:()=>s,metadata:()=>i,toc:()=>u});var a=n(7462),r=(n(7294),n(3905));const s={},o="Auth Sessions and Tokens",i={unversionedId:"code-base-works/auth-sessions-and-tokens",id:"code-base-works/auth-sessions-and-tokens",title:"Auth Sessions and Tokens",description:"First login",source:"@site/docs/code-base-works/auth-sessions-and-tokens.md",sourceDirName:"code-base-works",slug:"/code-base-works/auth-sessions-and-tokens",permalink:"/dashboard/code-base-works/auth-sessions-and-tokens",draft:!1,tags:[],version:"current",lastUpdatedAt:1680190644,formattedLastUpdatedAt:"Mar 30, 2023",frontMatter:{},sidebar:"mainSidebar",previous:{title:"API",permalink:"/dashboard/code-base-works/api-resources-and-schemas"},next:{title:"Cluster Management Resources",permalink:"/dashboard/code-base-works/cluster-management-resources"}},l={},u=[{value:"First login",id:"first-login",level:2},{value:"Cookies",id:"cookies",level:2},{value:"Third-party Integration with Rancher Auth",id:"third-party-integration-with-rancher-auth",level:2},{value:"Custom NavLinks",id:"custom-navlinks",level:2}],c={toc:u};function h(e){let{components:t,...n}=e;return(0,r.kt)("wrapper",(0,a.Z)({},c,n,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("h1",{id:"auth-sessions-and-tokens"},"Auth Sessions and Tokens"),(0,r.kt)("h2",{id:"first-login"},"First login"),(0,r.kt)("p",null,"After instantiating Rancher for the first time, it will be required to pick a bootstrap password, which will be the ",(0,r.kt)("inlineCode",{parentName:"p"},"admin")," password. Is it possible to include as environment variable ",(0,r.kt)("inlineCode",{parentName:"p"},"CATTLE_BOOTSTRAP_PASSWORD"),".\nThe value of the password must be valid, e.g. not match the username value and be at least 12 characters. This last restriction can bd changed with ",(0,r.kt)("inlineCode",{parentName:"p"},"CATTLE_PASSWORD_MIN_LENGTH"),"."),(0,r.kt)("p",null,"Bear mind that the whole first access process will require both the steps to be completed."),(0,r.kt)("p",null,"This process cannot be reversed, still admin password can be changed in the profile page."),(0,r.kt)("h2",{id:"cookies"},"Cookies"),(0,r.kt)("p",null,"Rancher uses the following cookies:"),(0,r.kt)("table",null,(0,r.kt)("thead",{parentName:"table"},(0,r.kt)("tr",{parentName:"thead"},(0,r.kt)("th",{parentName:"tr",align:null},"Name"),(0,r.kt)("th",{parentName:"tr",align:null},"Description"))),(0,r.kt)("tbody",{parentName:"table"},(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},(0,r.kt)("inlineCode",{parentName:"td"},"R_SESS")),(0,r.kt)("td",{parentName:"tr",align:null},"The logged in user's session token")),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},(0,r.kt)("inlineCode",{parentName:"td"},"R_PCS")),(0,r.kt)("td",{parentName:"tr",align:null},"The user's preferred color scheme, used for server side rendering. If it's auto, it's the user's system preference.")),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},(0,r.kt)("inlineCode",{parentName:"td"},"CSRF")),(0,r.kt)("td",{parentName:"tr",align:null},"Cross site request. The server sets this cookie as defined in the header of the request. For any request other than a GET request, we have to use Javascript to read this value and use it as a header in the request. That proves we are using our code on Rancher's domain and our header matches that cookie.")),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},(0,r.kt)("inlineCode",{parentName:"td"},"R_REDIRECTED")),(0,r.kt)("td",{parentName:"tr",align:null},"This cookie is used to redirect users from Ember to Vue when they upgrade from v2.5.x to v2.6.x.")),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},(0,r.kt)("inlineCode",{parentName:"td"},"R_LOCALE")),(0,r.kt)("td",{parentName:"tr",align:null},"Tracks the user's preferred language.")))),(0,r.kt)("p",null,"When users log in to Rancher, the UI sends the username and password to the back end, then Rancher sends the logged-in user's session cookie in the response back to us. Rancher uses cookies to track the session for the following reasons:"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},"Cookies are automatically sent by the browser with any request that matches the domain. Note: In some edge cases the browser may not use the port."),(0,r.kt)("li",{parentName:"ul"},"The cookie is http only, which means the browser uses it, but it cannot be accessed by Javascript in the browser. This is an important security feature because it means the cookie cannot be stolen by cross site scripting attacks.")),(0,r.kt)("p",null,"In general, we use the browser's local storage for client-side-only settings including window height and language."),(0,r.kt)("h2",{id:"third-party-integration-with-rancher-auth"},"Third-party Integration with Rancher Auth"),(0,r.kt)("p",null,"Sometimes a third-party application needs to integrate with Rancher such that after you install it as a Helm chart in Rancher, you can also access the application from a link in the Rancher UI."),(0,r.kt)("p",null,"In the case of Harvester, we injected headers and groups to tell Harvester who the user is and what groups they belong to. This means that Harvester doesn't need to call the Rancher API."),(0,r.kt)("p",null,"Application integrating with Rancher auth should never maintain their own separate authentication state or session. Due to the difficulty of maintaining consistent authentication state across browser windows and tabs, it would be a security risk to use more than one session along with Rancher's session."),(0,r.kt)("p",null,"The following should be true of any auth system integrating with Rancher:"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},"Only Rancher tokens are used to authenticate users."),(0,r.kt)("li",{parentName:"ul"},"The same session token is used for Rancher's session and the third party app session."),(0,r.kt)("li",{parentName:"ul"},"Logging out of Rancher also must also log you out of the third-party application."),(0,r.kt)("li",{parentName:"ul"},"Session storage is not used to store tokens.")),(0,r.kt)("p",null,"We don't recommend using session storage for auth because two tabs will have different storage even if both tabs are opened on the same domain. In that case, opening a new tab on the same domain would show the user a log-in screen. It is a better user experience to be able to share the same session across multiple tabs."),(0,r.kt)("h2",{id:"custom-navlinks"},"Custom NavLinks"),(0,r.kt)("p",null,"To set up a link to a third-party navigation link in the left navigation bar, we recommend using the NavLink custom resource. For more information on how to configure custom NavLinks, see the ",(0,r.kt)("a",{parentName:"p",href:"https://rancher.com/docs/rancher/v2.6/en/admin-settings/branding/#custom-navigation-links"},"Rancher documentation.")," NavLinks open in another window or tab. You can define grouped entries in them as well."),(0,r.kt)("p",null,"A third-party app installed with a Helm chart can deploy the NavLink custom resource along with the app. When this resource is deployed, the link will be hidden for users without access to the proxy."))}h.isMDXComponent=!0}}]);