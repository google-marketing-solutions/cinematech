import type { DirectiveBinding } from 'vue';

// Create a single tooltip element to be reused

const tooltipElement = document.createElement('div');
tooltipElement.className = 'custom-tooltip';
document.body.appendChild(tooltipElement);

function updateTooltipPosition(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const tooltipRect = tooltipElement.getBoundingClientRect();

  // Position above the element by default
  let top = rect.top - tooltipRect.height - 8;
  let left = rect.left + (rect.width - tooltipRect.width) / 2;

  // Check if it goes off screen top
  if (top < 0) {
    // Position below
    top = rect.bottom + 8;
  }

  // Check left/right bounds
  if (left < 0) left = 8;
  if (left + tooltipRect.width > window.innerWidth) {
    left = window.innerWidth - tooltipRect.width - 8;
  }

  tooltipElement.style.top = `${top}px`;
  tooltipElement.style.left = `${left}px`;
}

/**
 * A Vue directive for displaying a custom tooltip on hover.
 * This directive creates a single, reusable tooltip element and positions it
 * relative to the element it's bound to when the user hovers over it.
 * Usage: `<div v-tooltip="'My tooltip text'">...</div>`
 */
export const vTooltip = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    el.addEventListener('mouseenter', () => {
      if (!binding.value) return;
      tooltipElement.textContent = binding.value;
      tooltipElement.classList.add('visible');
      updateTooltipPosition(el);
    });

    el.addEventListener('mouseleave', () => {
      tooltipElement.classList.remove('visible');
    });

    // Update position on scroll or resize if needed, but for now simple hover is enough
    // We could add a resize observer if elements move around a lot
  },
  updated(el: HTMLElement, binding: DirectiveBinding) {
    // Update text if binding value changes while hovering
    if (tooltipElement.classList.contains('visible') && binding.value) {
      tooltipElement.textContent = binding.value;
      updateTooltipPosition(el);
    }
  },
  unmounted() {
    // Cleanup listeners is handled automatically by browser for removed elements usually,
    // but good practice to ensure tooltip hides if element is removed while hovering
    tooltipElement.classList.remove('visible');
  },
};
