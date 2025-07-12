import { RichTextEditor } from '@mantine/rte';
import { Mention } from '@tiptap/extension-mention';
import tippy from 'tippy.js';


const users = [
  { id: '1', label: 'Total Walrus' },
  { id: '2', label: 'Smart Owl' },
  { id: '3', label: 'Advanced Yak' },
];

const mentionExtension = Mention.configure({
  HTMLAttributes: {
    class: 'mention',
  },
  suggestion: {
    char: '@',
    items: ({ query }) => {
      return users
        .filter((user) => user.label.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5);
    },
    render: () => {
      let component;
      let popup;

      return {
        onStart: (props) => {
          component = document.createElement('div');
          component.className = 'mention-list';
          component.innerHTML = props.items
            .map((item) => `<div class="mention-item">${item.label}</div>`)
            .join('');

          popup = tippy('body', {
            getReferenceClientRect: props.clientRect,
            appendTo: () => document.body,
            content: component,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start',
          })[0];

          component.querySelectorAll('.mention-item').forEach((el, index) => {
            el.addEventListener('click', () => {
              props.command(props.items[index]);
            });
          });
        },
        onUpdate(props) {
          component.innerHTML = props.items
            .map((item) => `<div class="mention-item">${item.label}</div>`)
            .join('');
        },
        onExit() {
          popup?.destroy();
        },
      };
    },
  },
});
export default mentionExtension;