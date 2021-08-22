// common functions-----------------------------------------------------------------

function openParentDetails(element) {
  if (element.closest("details") && element.classList[0] !== "grid-container") {
    element.closest("details").open = true;
    openParentDetails(element.parentNode);
  }
}

function openChildDetails(element) {
  if (element.children[0] && element.children[0].tagName === "DETAILS") {
    element.children[0].open = true;
  }
}

// ---------------------------------------------------------------------------------

// main functions-------------------------------------------------------------------

function contentNavTocOpen() {
  const activeTocElement = document.querySelector(
    ".content_nav_toc_li.active,.content_nav_toc_l.active"
  );
  if (activeTocElement) {
    openParentDetails(activeTocElement);
    openChildDetails(activeTocElement);
  }
}

function addBackToTopEvent() {
  const backToTopElement = Array.from(
    document.getElementsByClassName("back_to_top")
  ).concat(Array.from(document.getElementsByClassName("aside_nav_title")));
  const contentToTop = Array.from(
    document.getElementsByClassName("content_nav")
  )
    .concat(Array.from(document.getElementsByClassName("content_body")))
    .concat(Array.from(document.getElementsByClassName("content_aside")));

  backToTopElement.forEach((element) => {
    element.addEventListener("click", () => {
      contentToTop.forEach((element) => {
        element.scrollTo({
          top: 0,
        });
      });
    });
  });
}

function addAsideTocHighlightEvent() {
  const tocClassL = document.querySelectorAll(".aside_toc_l");
  const tocClassLi = document.querySelectorAll(".aside_toc_li");

  // idMap -> idname: id element
  const idMap = new Map();

  // classMap -> idname: class element
  const classMap = new Map();

  tocClassL.forEach((element) => {
    const idLocal = element.classList[1];
    idMap.set(idLocal, document.getElementById(idLocal));
    classMap.set(idLocal, element);
  });

  tocClassLi.forEach((element) => {
    const idLocal = element.classList[1];
    idMap.set(idLocal, document.getElementById(idLocal));
    classMap.set(idLocal, element);
  });

  const activeTocElement = new Array(1);
  activeTocElement.length = 0;

  const handleIntersect = (entries) => {
    entries.forEach((entry) => {
      if (entry.intersectionRatio) {
        if (!activeTocElement.length) {
          activeTocElement.unshift(classMap.get(entry.target.id));
        } else {
          activeTocElement[0].classList.remove("active");
          activeTocElement.length = 0;
          activeTocElement.unshift(classMap.get(entry.target.id));
        }

        openParentDetails(activeTocElement[0]);
        openChildDetails(activeTocElement[0]);
        activeTocElement[0].classList.add("active");
      }
    });
  };

  const options = {
    root: null,
    rootMargin: "0px 0px -60% 0px",
  };

  const observer = new IntersectionObserver(handleIntersect, options);

  idMap.forEach((element, _) => {
    observer.observe(element);
  });
}

function addContentNavStoreEvent() {
  const storage = window.sessionStorage;
  const navContents = document.querySelectorAll(".content_nav_toc_l");
  navContents.forEach((element) => {
    if (element.children[0] && element.children[0].tagName === "DETAILS") {
      storage.setItem(
        element.classList[0] + element.classList[1],
        element.children[0].open
      );
    }
  });
}

function addContentNavLoadEvent() {
  const storage = window.sessionStorage;
  const navContents = document.querySelectorAll(".content_nav_toc_l");
  if (navContents.length > 0) {
    navContents.forEach((element) => {
      const elementKeyInStorage = element.classList[0] + element.classList[1];
      if (
        storage.getItem(elementKeyInStorage) &&
        storage.getItem(elementKeyInStorage) === "true"
      ) {
        openChildDetails(element);
      }
    });
  }
}

function addTocOpenStateStoreEvent() {
  const storage = window.sessionStorage;
  const contentNavCheck = document.getElementById("content_nav_check");
  const contentAsideCheck = document.getElementById("content_aside_check");
  if (!window.matchMedia("(max-width: 599px)").matches) {
    storage.setItem(`${contentNavCheck.id}_checked`, contentNavCheck.checked);
    storage.setItem(
      `${contentAsideCheck.id}_checked`,
      contentAsideCheck.checked
    );
  }
}

function addTocOpenStateLoadEvent() {
  const storage = window.sessionStorage;
  const contentNavCheck = document.getElementById("content_nav_check");
  const contentAsideCheck = document.getElementById("content_aside_check");
  if (!window.matchMedia("(max-width: 599px)").matches) {
    if (storage.getItem(`${contentNavCheck.id}_checked`)) {
      if (storage.getItem(`${contentNavCheck.id}_checked`) === "true") {
        contentNavCheck.checked = true;
      } else {
        contentNavCheck.checked = false;
      }
    }
    if (storage.getItem(`${contentAsideCheck.id}_checked`)) {
      if (storage.getItem(`${contentAsideCheck.id}_checked`) === "true") {
        contentAsideCheck.checked = true;
      } else {
        contentAsideCheck.checked = false;
      }
    }
  }
}

function addCloseAsideTocEvent() {
  if (window.matchMedia("(max-width: 599px)").matches) {
    const contentAsideLinks = Array.from(
      document.querySelectorAll(".aside_toc_li > a")
    )
      .concat(
        Array.from(
          document.querySelectorAll(".aside_toc_l > details > summary > a")
        )
      )
      .concat(Array.from(document.querySelectorAll(".aside_nav_title")));
    contentAsideLinks.forEach((element) => {
      const asideCheckBox = document.getElementById("content_aside_check");
      element.addEventListener("click", () => {
        asideCheckBox.checked = false;
      });
    });
  }
}

// ---------------------------------------------------------------------------------

// on load function-----------------------------------------------------------------

function onLoad() {
  contentNavTocOpen();
  addBackToTopEvent();
  addAsideTocHighlightEvent();
  addContentNavLoadEvent();
  addTocOpenStateLoadEvent();
  addCloseAsideTocEvent();
}

// ---------------------------------------------------------------------------------

// add event------------------------------------------------------------------------

window.addEventListener("load", () => {
  onLoad();
});

window.addEventListener("pagehide", () => {
  addContentNavStoreEvent();
  addTocOpenStateStoreEvent();
});

// ---------------------------------------------------------------------------------
