// TODO: muss noch optimiert werden
// assets/hugo-grid-gallery/js/scroll-to-top.js
"use strict";

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
};

let backToTopButton, backToTopButtonSvg, backToTopButtonImg;

function createButton(obj) {
  if (document.getElementById("hugg-back-to-top-button")) return;

  backToTopButton = document.createElement("button");
  backToTopButton.type = "button";
  backToTopButton.setAttribute("aria-label", "Back to top");
  backToTopButton.classList.add("hugg-back-to-top-button");
  backToTopButton.id = "hugg-back-to-top-button";

  document.body.appendChild(backToTopButton);

  backToTopButton.style.width = obj.buttonWidth;
  backToTopButton.style.height = obj.buttonHeight;
  backToTopButton.style.marginRight = obj.buttonDToRight;
  backToTopButton.style.marginBottom = obj.buttonDToBottom;
  backToTopButton.style.borderRadius = obj.roundnessSize;
  backToTopButton.style.boxShadow = `var(--hugg-scroll-shadow, ${obj.shadowSize})`;
  backToTopButton.style.position = "fixed";
  backToTopButton.style.outline = "none";
  backToTopButton.style.bottom = "0px";
  backToTopButton.style.right = "0px";
  backToTopButton.style.cursor = "pointer";
  backToTopButton.style.textAlign = "center";
  backToTopButton.style.border = "solid 2px";
  backToTopButton.innerHTML =
    '<svg class="hugg-back-to-top-button-svg" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" > <g fill="none" fill-rule="evenodd"> <path d="M0 0H32V32H0z" transform="translate(-1028 -172) translate(832 140) translate(32 32) translate(164) matrix(1 0 0 -1 0 32)" /> <path class="hugg-back-to-top-button-img" fill-rule="nonzero" d="M11.384 13.333h9.232c.638 0 .958.68.505 1.079l-4.613 4.07c-.28.246-.736.246-1.016 0l-4.613-4.07c-.453-.399-.133-1.079.505-1.079z" transform="translate(-1028 -172) translate(832 140) translate(32 32) translate(164) matrix(1 0 0 -1 0 32)" /> </g> </svg>';

  backToTopButtonSvg = backToTopButton.querySelector(".hugg-back-to-top-button-svg");
  backToTopButtonSvg.style.verticalAlign = "middle";
  backToTopButtonSvg.style.margin = "auto";
  backToTopButtonSvg.style.justifyContent = "center";
  backToTopButtonSvg.style.width = obj.svgWidth;
  backToTopButtonSvg.style.height = obj.svgHeight;
  backToTopButton.appendChild(backToTopButtonSvg);
  backToTopButtonImg = backToTopButton.querySelector(".hugg-back-to-top-button-img");
  backToTopButtonImg.style.fill = `var(--hugg-scroll-icon-color, ${obj.selectedIconColor})`;
  backToTopButtonSvg.appendChild(backToTopButtonImg);
  backToTopButtonImg.setAttribute("d", obj.buttonD);
  backToTopButtonImg.setAttribute("transform", obj.buttonT);

  backToTopButton.style.display = "none";
  window.addEventListener("scroll", function () {
    if (
      document.body.scrollTop > 20 ||
      document.documentElement.scrollTop > 20
    ) {
      backToTopButton.style.display = "block";
    } else {
      backToTopButton.style.display = "none";
    }
  });

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
