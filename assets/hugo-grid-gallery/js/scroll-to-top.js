// TODO: muss noch optimiert werden
// assets/hugo-grid-gallery/js/scroll-to-top.js
"use strict";

// Site-Config aus gallery-config.html (Fallback auf {})
const siteCfg =
  (typeof window !== "undefined" && window.configObj) ? window.configObj : {};

// Defaults; einzelne Werte können via data/gallery/config -> scrollToTop überschrieben werden
const configObj = {
  buttonD:
    "M16.806 13.667v-5.25c0-.967-.841-1.75-1.879-1.75-1.037 0-1.878.783-1.878 1.75v8.998c0 .912-1.073 1.472-1.907.995l-1.79-1.024c-.588-.328-1.326-.312-1.896.042-.93.578-1.061 1.805-.27 2.542l5.757 5.363h10.929l1.43-7.49c.22-1.333-.714-2.594-2.129-2.876l-6.367-1.3z",
  buttonT:
    "translate(-1208 -172) translate(832 140) translate(32 32) translate(344)",
  shadowSize:
    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  roundnessSize: "999px",
  buttonDToBottom: "25px",
  buttonDToRight: "25px",
  selectedBackgroundColor: "#4f2871",
  selectedIconColor: "white",
  buttonWidth: "40px",
  buttonHeight: "40px",
  svgWidth: "32px",
  svgHeight: "32px",
  ...(siteCfg.scrollToTop || {}),
};

let backToTopButton, backToTopButtonSvg, backToTopButtonImg;

function createButton(obj) {
  const body = document.querySelector("body");

  backToTopButton = document.createElement("span");
  backToTopButton.classList.add("back-to-top-button");
  backToTopButton.id = "back-to-top-button";

  body.appendChild(backToTopButton);

  backToTopButton.style.width = obj.buttonWidth;
  backToTopButton.style.height = obj.buttonHeight;
  backToTopButton.style.marginRight = obj.buttonDToRight;
  backToTopButton.style.marginBottom = obj.buttonDToBottom;
  backToTopButton.style.borderRadius = obj.roundnessSize;
  backToTopButton.style.boxShadow = obj.shadowSize;
  backToTopButton.style.position = "fixed";
  backToTopButton.style.outline = "none";
  backToTopButton.style.bottom = "0px";
  backToTopButton.style.right = "0px";
  backToTopButton.style.cursor = "pointer";
  backToTopButton.style.textAlign = "center";
  backToTopButton.style.border = "solid 2px";
  backToTopButton.innerHTML =
    '<svg class="back-to-top-button-svg" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" > <g fill="none" fill-rule="evenodd"> <path d="M0 0H32V32H0z" transform="translate(-1028 -172) translate(832 140) translate(32 32) translate(164) matrix(1 0 0 -1 0 32)" /> <path class="back-to-top-button-img" fill-rule="nonzero" d="M11.384 13.333h9.232c.638 0 .958.68.505 1.079l-4.613 4.07c-.28.246-.736.246-1.016 0l-4.613-4.07c-.453-.399-.133-1.079.505-1.079z" transform="translate(-1028 -172) translate(832 140) translate(32 32) translate(164) matrix(1 0 0 -1 0 32)" /> </g> </svg>';

  // old: '<svg class="back-to-top-button-svg" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" > <g fill="none" fill-rule="evenodd"> <path d="M0 0H32V32H0z" transform="translate(-1028 -172) translate(832 140) translate(32 32) translate(164) matrix(1 0 0 -1 0 32)" /> <path class="back-to-top-button-img" fill-rule="nonzero" d="M11.384 13.333h9.232c.638 0 .958.68.505 1.079l-4.613 4.07c-.28.246-.736.246-1.016 0l-4.613-4.07c-.453-.399-.133-1.079.505-1.079z" transform="translate(-1028 -172) translate(832 140) translate(32 32) translate(164) matrix(1 0 0 -1 0 32)" /> </g> </svg>';
  // new: '<svg class="back-to-top-button-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" width="24" height="24" stroke-width="2"> <path d="M4 13l8 -3l8 3"></path> </svg>';
  // new2: '<svg class="back-to-top-button-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" width="24" height="24" stroke-width="2"> <path d="M8 13v-8.5a1.5 1.5 0 0 1 3 0v7.5"></path> <path d="M11 11.5v-2a1.5 1.5 0 1 1 3 0v2.5"></path> <path d="M14 10.5a1.5 1.5 0 0 1 3 0v1.5"></path> <path d="M17 11.5a1.5 1.5 0 0 1 3 0v4.5a6 6 0 0 1 -6 6h-2h.208a6 6 0 0 1 -5.012 -2.7a69.74 69.74 0 0 1 -.196 -.3c-.312 -.479 -1.407 -2.388 -3.286 -5.728a1.5 1.5 0 0 1 .536 -2.022a1.867 1.867 0 0 1 2.28 .28l1.47 1.47"></path> </svg>';
  backToTopButtonSvg = document.querySelector(".back-to-top-button-svg");
  backToTopButtonSvg.style.verticalAlign = "middle";
  backToTopButtonSvg.style.margin = "auto";
  backToTopButtonSvg.style.justifyContent = "center";
  backToTopButtonSvg.style.width = obj.svgWidth;
  backToTopButtonSvg.style.height = obj.svgHeight;
  backToTopButton.appendChild(backToTopButtonSvg);
  backToTopButtonImg = document.querySelector(".back-to-top-button-img");
  backToTopButtonImg.style.fill = obj.selectedIconColor;
  backToTopButtonSvg.appendChild(backToTopButtonImg);
  backToTopButtonImg.setAttribute("d", obj.buttonD);
  backToTopButtonImg.setAttribute("transform", obj.buttonT);

  backToTopButton.style.display = "none";
  window.onscroll = function () {
    if (
      document.body.scrollTop > 20 ||
      document.documentElement.scrollTop > 20
    ) {
      backToTopButton.style.display = "block";
    } else {
      backToTopButton.style.display = "none";
    }
  };

  backToTopButton.onclick = function () {
    document.body.scrollTop = 0;
    // document.documentElement.scrollTop = 0;

    document.documentElement.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
}

document.addEventListener("DOMContentLoaded", function () {
  createButton(configObj);
});
