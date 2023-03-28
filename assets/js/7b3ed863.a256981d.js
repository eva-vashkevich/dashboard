"use strict";(self.webpackChunkrancher_ui_devkit=self.webpackChunkrancher_ui_devkit||[]).push([[657],{3905:(e,t,n)=>{n.d(t,{Zo:()=>u,kt:()=>p});var o=n(7294);function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function r(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);t&&(o=o.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,o)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?r(Object(n),!0).forEach((function(t){a(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):r(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,o,a=function(e,t){if(null==e)return{};var n,o,a={},r=Object.keys(e);for(o=0;o<r.length;o++)n=r[o],t.indexOf(n)>=0||(a[n]=e[n]);return a}(e,t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);for(o=0;o<r.length;o++)n=r[o],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(a[n]=e[n])}return a}var l=o.createContext({}),c=function(e){var t=o.useContext(l),n=t;return e&&(n="function"==typeof e?e(t):i(i({},t),e)),n},u=function(e){var t=c(e.components);return o.createElement(l.Provider,{value:t},e.children)},d={inlineCode:"code",wrapper:function(e){var t=e.children;return o.createElement(o.Fragment,{},t)}},h=o.forwardRef((function(e,t){var n=e.components,a=e.mdxType,r=e.originalType,l=e.parentName,u=s(e,["components","mdxType","originalType","parentName"]),h=c(n),p=a,m=h["".concat(l,".").concat(p)]||h[p]||d[p]||r;return n?o.createElement(m,i(i({ref:t},u),{},{components:n})):o.createElement(m,i({ref:t},u))}));function p(e,t){var n=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var r=n.length,i=new Array(r);i[0]=h;var s={};for(var l in t)hasOwnProperty.call(t,l)&&(s[l]=t[l]);s.originalType=e,s.mdxType="string"==typeof e?e:a,i[1]=s;for(var c=2;c<r;c++)i[c]=n[c];return o.createElement.apply(null,i)}return o.createElement.apply(null,n)}h.displayName="MDXCreateElement"},7051:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>l,contentTitle:()=>i,default:()=>d,frontMatter:()=>r,metadata:()=>s,toc:()=>c});var o=n(7462),a=(n(7294),n(3905));const r={},i="Concepts",s={unversionedId:"getting-started/concepts",id:"getting-started/concepts",title:"Concepts",description:"This section is intended to provide an outline of background concepts behind Rancher, Kubernetes and containers. It is intended to be used as a starting point by new hires who may not come from a DevOps background and may not have experience with Kubernetes or containerization.",source:"@site/docs/getting-started/concepts.md",sourceDirName:"getting-started",slug:"/getting-started/concepts",permalink:"/dashboard/getting-started/concepts",draft:!1,tags:[],version:"current",lastUpdatedAt:1680000274,formattedLastUpdatedAt:"Mar 28, 2023",frontMatter:{},sidebar:"mainSidebar",previous:{title:"Quickstart",permalink:"/dashboard/getting-started/quickstart"},next:{title:"Development Environment",permalink:"/dashboard/getting-started/development_environment"}},l={},c=[{value:"UI Walkthrough",id:"ui-walkthrough",level:2},{value:"1. Terminology",id:"1-terminology",level:2},{value:"2. Containers",id:"2-containers",level:2},{value:"3. Container images",id:"3-container-images",level:2},{value:"4. Kubernetes",id:"4-kubernetes",level:2},{value:"Top 6 Most Important Kubernetes Concepts",id:"top-6-most-important-kubernetes-concepts",level:3},{value:"5. Rancher",id:"5-rancher",level:2}],u={toc:c};function d(e){let{components:t,...n}=e;return(0,a.kt)("wrapper",(0,o.Z)({},u,n,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("h1",{id:"concepts"},"Concepts"),(0,a.kt)("p",null,"This section is intended to provide an outline of background concepts behind Rancher, Kubernetes and containers. It is intended to be used as a starting point by new hires who may not come from a DevOps background and may not have experience with Kubernetes or containerization."),(0,a.kt)("p",null,"It can be hard to explain Rancher in layman's terms because it's hard to understand a technology if you don't understand the problem it is intended to solve. Rancher was originally designed to help enterprises solve problems that come with running many containers in production at scale, so if you haven't used containers in production, it can help to learn about containers and Kubernetes before learning about Rancher itself."),(0,a.kt)("p",null,"The following learning path is a suggested guide for which order to learn Rancher concepts. Each concept in this order builds on the one before. If you are studying Kubernetes online, it is best to focus on materials that begin with explaining containers and container images and build on that knowledge from there."),(0,a.kt)("h1",{id:"official-courses"},"Official Courses"),(0,a.kt)("p",null,"SUSE provides official training on Rancher and K3s. The courses are on the ",(0,a.kt)("a",{parentName:"p",href:"https://community.suse.com/all-courses"},"SUSE community website.")," However, because Rancher is built on top of Kubernetes and Kubernetes manages containers, it is ideal to have at least some familiarity with containers and Kubernetes before diving into Rancher."),(0,a.kt)("h2",{id:"ui-walkthrough"},"UI Walkthrough"),(0,a.kt)("p",null,"An intro to the Rancher UI is ",(0,a.kt)("a",{parentName:"p",href:"/dashboard/getting-started/ui-walkthrough"},"here.")),(0,a.kt)("h1",{id:"learning-path"},"Learning path"),(0,a.kt)("h2",{id:"1-terminology"},"1. Terminology"),(0,a.kt)("p",null,"It may be helpful to start with the ",(0,a.kt)("a",{parentName:"p",href:"https://kubernetes.io/docs/reference/glossary/?fundamental=true"},"official Kubernetes glossary.")),(0,a.kt)("h2",{id:"2-containers"},"2. Containers"),(0,a.kt)("p",null,"The most fundamental concept in the Rancher world is the concept of a container. A container is an is a discrete environment set up within an operating system in which one or more applications may be run, typically assigned only those resources necessary for the application to function correctly."),(0,a.kt)("p",null,"Containers became more popular in recent years because they solve a big problem with deploying software, which is that it is difficult to get software to reliably run when it is moved or rebuilt in different computing environments. When the process to deploy software in production is done manually, it is prone to errors. Containers solve that problem by making it so that the computing environment is identical wherever the software is run."),(0,a.kt)("p",null,"Containers originally come from the Linux operating system and they have existed for a long time. The innovation of Docker was to make it quicker and easier to manage Linux containers, and Docker played a large role in popularizing containers as an environment to run software in. (Even if you run Docker on a Mac, it will create a Linux virtual machine just to run containers in it.)"),(0,a.kt)("p",null,'Docker is not the only tool that you can manage containers with. Docker is historically the most popular container runtime tool, but was always possible to run containers without Docker because they were a built-in feature of Linux. And ever since Docker was purchased by Mirantis, the DevOps industry as a whole is moving away from Docker as the main solution for container management, so there is an interest in using more container runtimes than just Docker. In Rancher, we are moving toward making the language we use to talk about containers more generic so that it doesn\'t imply that you can only use Docker for the container\'s runtime environment. For example, instead of "Docker image" we often say "container image" to include the possibility of using a tool such as ',(0,a.kt)("inlineCode",{parentName:"p"},"containerd")," instead of Docker to provide the container runtime."),(0,a.kt)("p",null,"For more information about containers, FreeCodeCamp provides a relatively approachable conceptual guide ",(0,a.kt)("a",{parentName:"p",href:"https://www.freecodecamp.org/news/a-beginner-friendly-introduction-to-containers-vms-and-docker-79a9e3e119b/"},"here.")),(0,a.kt)("h2",{id:"3-container-images"},"3. Container images"),(0,a.kt)("p",null,"A container image is a static file with executable code that can create a container on a computing system. A container image is immutable, and can be deployed consistently in any environment."),(0,a.kt)("p",null,"A Docker image - the most common type of container image - is a file used to execute code in a Docker container. Docker images act as a set of instructions to build a Docker container, like a template."),(0,a.kt)("p",null,"To gain familiarity with building and running container images, it may help to go through some of the tutorials in the official ",(0,a.kt)("a",{parentName:"p",href:"https://docs.docker.com/get-started/"},"Docker documentation.")),(0,a.kt)("h2",{id:"4-kubernetes"},"4. Kubernetes"),(0,a.kt)("p",null,"Kubernetes is an open-source system for automating deployment, scaling, and management of containerized applications."),(0,a.kt)("p",null,"While it is possible to build a Kubernetes cluster on a single node managing a simple software application, that is not really what Kubernetes is intended for. Kubernetes is a complex solution intended to solve complex problems, and it is recommended for users who are running software applications that consist of at least twelve to fourteen microservices. When we say microservices, we mean that the software is so complex that it needed to be divided into multiple independent parts that run in separate containers. If your software application can run in a single container, you probably don't need Kubernetes because it would be easier to manage it manually than to introduce the full complexity of Kubernetes to manage that container."),(0,a.kt)("p",null,"Kubernetes is too complex to document it all here, but a good starting point would be to go through the tutorials in the official ",(0,a.kt)("a",{parentName:"p",href:"https://kubernetes.io/docs/tutorials/"},"Kubernetes documentation.")," Minikube and K3d are examples of tools that let you play with Kubernetes in a sandbox environment for development and testing purposes."),(0,a.kt)("h3",{id:"top-6-most-important-kubernetes-concepts"},"Top 6 Most Important Kubernetes Concepts"),(0,a.kt)("ol",null,(0,a.kt)("li",{parentName:"ol"},(0,a.kt)("strong",{parentName:"li"},"Pods:")," Kubernetes doesn't directly manipulate containers. Instead, the fundamental Kubernetes resource is the ",(0,a.kt)("a",{parentName:"li",href:"https://kubernetes.io/docs/concepts/workloads/pods/"},"Pod,")," which encapsulates one or more containers (usually one). Everything in Kubernetes comes back around to Pods in the end, because Pods encapsulate containers, so Kubernetes can't manage containers without them."),(0,a.kt)("li",{parentName:"ol"},(0,a.kt)("strong",{parentName:"li"},"Workloads:"),' Most people who use Kubernetes don\'t directly manipulate Pods. The three most important Kubernetes resources for indirectly manipulating Pods are called Deployments, StatefulSets, and Daemonsets. The term "workloads" is often used to describe apps and services running in Pods, no matter what Kubernetes resource is actually controlling those Pods. Information on all types of workloads can be found in the ',(0,a.kt)("a",{parentName:"li",href:"https://kubernetes.io/docs/concepts/workloads/"},"Kubernetes documentation.")," These workload management resources allow you to delegate management of the Pods so that you don't have to manually manipulate them yourself."),(0,a.kt)("li",{parentName:"ol"},(0,a.kt)("strong",{parentName:"li"},"YAML config files:")," Every aspect of a Kubernetes cluster can be specified declaratively in YAML configuration files. Each YAML file ends in ",(0,a.kt)("inlineCode",{parentName:"li"},".yml")," or ",(0,a.kt)("inlineCode",{parentName:"li"},".yaml")," and consists of key-value pairs, in which the order of the keys doesn't matter but the indentation does. These declarative config files are important because they allow Kubernetes admins and operators to easily see how something in Kubernetes is configured and to look at past versions of config files to see how it has changed in the past."),(0,a.kt)("li",{parentName:"ol"},(0,a.kt)("strong",{parentName:"li"},"Kubernetes API:")," Every Kubernetes cluster has a Kubernetes API server. When you manipulate a Kubernetes cluster using the ",(0,a.kt)("inlineCode",{parentName:"li"},"kubectl")," command line tool, that tool calls the Kubernetes API. When Rancher manages Kubernetes clusters, it calls the Kubernetes API server of each individual cluster that it manages."),(0,a.kt)("li",{parentName:"ol"},(0,a.kt)("strong",{parentName:"li"},"etcd:")," All data about the Kubernetes cluster is stored in a database called ",(0,a.kt)("inlineCode",{parentName:"li"},"etcd"),". When you back up a Kubernetes cluster, you are backing up ",(0,a.kt)("inlineCode",{parentName:"li"},"etcd"),". When you restore a Kubernetes cluster, you restore ",(0,a.kt)("inlineCode",{parentName:"li"},"etcd"),". When you call the Kubernetes API server with ",(0,a.kt)("inlineCode",{parentName:"li"},"kubectl"),", the server gives you the data you want from ",(0,a.kt)("inlineCode",{parentName:"li"},"etcd"),". If ",(0,a.kt)("inlineCode",{parentName:"li"},"etcd")," is corrupted, the Kubernetes cluster needs to be restored from backup. In a Kubernetes cluster, the best practice is to assign three nodes in the cluster with the ",(0,a.kt)("inlineCode",{parentName:"li"},"etcd")," role, which means the distributed ",(0,a.kt)("inlineCode",{parentName:"li"},"etcd")," database will run on those three nodes. (It needs an odd number of nodes so that if there is an inconsistency in the database, it can be resolved with a majority vote.)"),(0,a.kt)("li",{parentName:"ol"},(0,a.kt)("strong",{parentName:"li"},"Networking:")," For newcomers to Kubernetes, one of the most challenging aspects to understand is Kubernetes networking. Although it is complex, it is essential to understand networking so that you can understand how data flows through a cluster. The following resources are helpful for getting a more intuitive understanding of how workloads, Ingresses and different types of Services work together:")),(0,a.kt)("ul",null,(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("a",{parentName:"li",href:"https://stackoverflow.com/questions/45079988/ingress-vs-load-balancer"},"https://stackoverflow.com/questions/45079988/ingress-vs-load-balancer")),(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("a",{parentName:"li",href:"https://www.ibm.com/docs/en/cloud-private/3.2.0?topic=networking-kubernetes-service-types"},"https://www.ibm.com/docs/en/cloud-private/3.2.0?topic=networking-kubernetes-service-types")),(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("a",{parentName:"li",href:"https://medium.com/google-cloud/kubernetes-nodeport-vs-loadbalancer-vs-ingress-when-should-i-use-what-922f010849e0"},"https://medium.com/google-cloud/kubernetes-nodeport-vs-loadbalancer-vs-ingress-when-should-i-use-what-922f010849e0"))),(0,a.kt)("h2",{id:"5-rancher"},"5. Rancher"),(0,a.kt)("p",null,"When enterprises began adopting containers as a tool to deploy their software in production, they began facing a common set of problems. When you deploy software as a system of interconnected microservices, each running in a container, what you find is that it becomes complicated to troubleshoot and debug those clusters. To name a couple of the most common problems, it's hard to read the logs because the logs are spread out across many containers, potentially on many nodes. And it's hard to monitor resource consumption, again due to the number of containers and nodes. It's impractical to run a Kubernetes cluster without add-on solutions such as those."),(0,a.kt)("p",null,"On top of that, many enterprises have not one, but many Kubernetes clusters, and they may be running in different environments. Some clusters may be in on-premises machines, while some are in Amazon EC2, and others are in Digital Ocean. Rancher lets you control security policies and manage authentication for all of the Kubernetes clusters from a single UI, and Rancher is intended to be open-ended and interoperable enough that it lets you run Kubernetes everywhere."),(0,a.kt)("p",null,"So Rancher offers Kubernetes admins a lot of tools to make their lives easer, allowing them to set up authentication with a variety of providers, set up security policies across the board, and easily install tools such as logging and monitoring tools that otherwise would have been difficult to set up."),(0,a.kt)("p",null,"Rancher has changed over the years. Rancher v1 originally offered its own container orchestration system called Cattle, but in Rancher v2, it pivoted to Kubernetes because Kubernetes became the industry standard system for managing containers. In v2.4, Rancher recognized that the industry was moving in a direction in which customers were deploying many smaller Kubernetes clusters. For example, some customers wanted a Kubernetes cluster in every bank branch, every retail location, or every restaurant location. Therefore in v2.4, Rancher improved its ability to scale to up to a million Kubernetes clusters. Then in Rancher v2.5, Rancher expanded its target user base. Before v2.5, it was marketed to Kubernetes admins in an enterprise setting who were managing multiple Kubernetes clusters. But in v2.5+, Rancher also supports a single-cluster use case. In other words, Rancher can now be used if you just want to use the Rancher UI (particularly the cluster explorer part of the UI) to help you manipulate a single Kubernetes cluster. This use case is friendlier for users who are new to Kubernetes or would like to experiment with Kubernetes through Rancher, or users with simpler use cases, thus broadening the number of people who can benefit from using Rancher."))}d.isMDXComponent=!0}}]);