document.addEventListener("DOMContentLoaded", function () {
  // Get all slider containers on the page
  const sliderContainers = document.querySelectorAll(
    ".product-slider-container"
  );

  sliderContainers.forEach((container) => {
    const track = container.querySelector(".product-slider-track");
    const cards = Array.from(container.querySelectorAll(".product-card"));
    const nextButton = container.querySelector(".next-button");
    const prevButton = container.querySelector(".prev-button");

    // Calculate the full width of a card (including margin-right)
    function getCardWidth() {
      const computedStyle = window.getComputedStyle(cards[0]);
      const marginRight = parseInt(computedStyle.marginRight);
      return cards[0].offsetWidth + marginRight;
    }

    // Determine how many cards are visible within the container
    function getVisibleCardCount() {
      return Math.floor(container.offsetWidth / getCardWidth());
    }

    // Calculate the maximum index the slider can move to
    function calculateMaxIndex() {
      return Math.max(0, cards.length - getVisibleCardCount());
    }

    let currentIndex = 0;
    let maxIndex = calculateMaxIndex();

    // Update the position of the slider track
    function updateSliderPosition(animated = true) {
      const cardWidth = getCardWidth();
      const translateX = -1 * currentIndex * cardWidth;

      if (animated) {
        track.style.transition = "transform 0.3s ease-in-out";
        setTimeout(() => {
          track.style.transition = "";
        }, 300);
      } else {
        track.style.transition = "none";
      }

      track.style.transform = `translateX(${translateX}px)`;
      updateButtonsState();
    }

    // Enable/disable navigation buttons based on the current position
    function updateButtonsState() {
      prevButton.style.opacity = currentIndex === 0 ? "0.5" : "1";
      prevButton.style.cursor = currentIndex === 0 ? "default" : "pointer";

      nextButton.style.opacity = currentIndex >= maxIndex ? "0.5" : "1";
      nextButton.style.cursor =
        currentIndex >= maxIndex ? "default" : "pointer";
    }

    // Navigation event listeners
    nextButton.addEventListener("click", function () {
      if (currentIndex < maxIndex) {
        currentIndex++;
        updateSliderPosition();
      }
    });

    prevButton.addEventListener("click", function () {
      if (currentIndex > 0) {
        currentIndex--;
        updateSliderPosition();
      }
    });

    // Add touch support for mobile devices
    let startX, moveX, initialPosition;
    let isDragging = false;

    track.addEventListener(
      "touchstart",
      function (e) {
        startX = e.touches[0].clientX;
        // If no transform exists, default to 0
        initialPosition =
          parseFloat(
            track.style.transform.replace("translateX(", "").replace("px)", "")
          ) || 0;
        isDragging = true;
      },
      { passive: true }
    );

    track.addEventListener(
      "touchmove",
      function (e) {
        if (!isDragging) return;
        moveX = e.touches[0].clientX;
        const diff = moveX - startX;
        track.style.transform = `translateX(${initialPosition + diff}px)`;
      },
      { passive: true }
    );

    track.addEventListener("touchend", function () {
      isDragging = false;
      if (moveX === undefined) return;

      const diff = moveX - startX;
      const threshold = getCardWidth() / 3;

      if (diff < -threshold && currentIndex < maxIndex) {
        currentIndex++;
      } else if (diff > threshold && currentIndex > 0) {
        currentIndex--;
      }

      updateSliderPosition(true);
      moveX = undefined;
    });

    // Update slider settings when the window is resized
    let resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const newMaxIndex = calculateMaxIndex();
        if (currentIndex > newMaxIndex) {
          currentIndex = Math.max(0, newMaxIndex);
        }
        maxIndex = newMaxIndex;
        updateSliderPosition(false);
        updateButtonsState();
      }, 100);
    });

    // Initial button state
    updateButtonsState();
  });
});
