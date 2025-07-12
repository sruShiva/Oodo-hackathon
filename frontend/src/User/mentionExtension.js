import { Node } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

// Inject CSS for mentions
const style = document.createElement('style');
style.textContent = `
  .mention {
    background-color: #eef6ff;
    color: #1a73e8;
    padding: 2px 4px;
    border-radius: 3px;
    font-weight: 500;
  }
  .mention-list {
    background: white;
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 8px 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 9999;
    position: absolute;
    min-width: 180px;
  }
  .mention-item {
    padding: 8px 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .mention-item:hover {
    background-color: #f5f5f5;
  }
  .mention-item.selected {
    background-color: #e3f2fd;
  }
  .mention-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: #A259FF;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
  }
  .dark .mention-list {
    background: #1E1E1E;
    border-color: #333;
    color: #fff;
  }
  .dark .mention-item:hover {
    background-color: #2a2a2a;
  }
  .dark .mention-item.selected {
    background-color: #2d3748;
  }
`;
document.head.appendChild(style);

// User data
const users = [
  { id: '1', label: 'Total Walrus' },
  { id: '2', label: 'Smart Owl' },
  { id: '3', label: 'Advanced Yak' },
  { id: '4', label: 'Code Ninja' },
  { id: '5', label: 'Data Wizard' },
];

// Mention node
const MentionNode = Node.create({
  name: 'mention',
  group: 'inline',
  inline: true,
  selectable: false,
  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => {
          if (!attributes.id) {
            return {}
          }
          return {
            'data-id': attributes.id,
          }
        },
      },
      label: {
        default: null,
        parseHTML: element => element.getAttribute('data-label'),
        renderHTML: attributes => {
          if (!attributes.label) {
            return {}
          }
          return {
            'data-label': attributes.label,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="mention"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', { ...HTMLAttributes, 'data-type': 'mention', class: 'mention' }, `@${HTMLAttributes['data-label']}`]
  },

  renderText({ node }) {
    return `@${node.attrs.label}`
  },

  addKeyboardShortcuts() {
    return {
      Backspace: () => this.editor.commands.command(({ tr, state }) => {
        let isMention = false
        const { selection } = state
        const { empty, anchor } = selection

        if (!empty) {
          return false
        }

        state.doc.nodesBetween(anchor - 1, anchor, (node, pos) => {
          if (node.type.name === this.name) {
            isMention = true
            tr.insertText('', pos, pos + node.nodeSize)
            return false
          }
        })

        return isMention
      }),
    }
  },
})

// Mention suggestion plugin
const MentionSuggestionPlugin = new Plugin({
  key: new PluginKey('mentionSuggestion'),
  state: {
    init() {
      return {
        active: false,
        range: null,
        query: '',
        items: [],
        selectedIndex: 0,
        popup: null,
      }
    },
    apply(tr, prev) {
      const { selection } = tr
      const next = { ...prev }

      if (selection.empty) {
        const { $from } = selection
        const text = $from.parent.textContent
        const beforeCursor = text.slice(0, $from.parentOffset)
        const match = beforeCursor.match(/@(\w*)$/)

        if (match) {
          const query = match[1]
          const items = users.filter(user => 
            user.label.toLowerCase().includes(query.toLowerCase())
          ).slice(0, 5)

          next.active = true
          next.range = {
            from: $from.pos - match[0].length,
            to: $from.pos,
          }
          next.query = query
          next.items = items
          next.selectedIndex = 0
        } else {
          next.active = false
          next.range = null
          next.query = ''
          next.items = []
          next.selectedIndex = 0
        }
      } else {
        next.active = false
        next.range = null
        next.query = ''
        next.items = []
        next.selectedIndex = 0
      }

      return next
    },
  },
  props: {
    handleKeyDown(view, event) {
      const state = this.getState(view.state)
      const { active, items, selectedIndex } = state
      
      if (!active || items.length === 0) return false

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        const newIndex = selectedIndex < items.length - 1 ? selectedIndex + 1 : 0
        const newState = { ...state, selectedIndex: newIndex }
        this.updatePopup(view, newState)
        return true
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        const newIndex = selectedIndex > 0 ? selectedIndex - 1 : items.length - 1
        const newState = { ...state, selectedIndex: newIndex }
        this.updatePopup(view, newState)
        return true
      }

      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault()
        this.selectItem(view, items[selectedIndex])
        return true
      }

      if (event.key === 'Escape') {
        this.hidePopup()
        return true
      }

      return false
    },
  },
  view(editorView) {
    return {
      update: (view) => {
        const state = this.key.getState(view.state)
        const { active, items, selectedIndex, range } = state
        
        if (!active || items.length === 0) {
          this.hidePopup()
          return
        }

        this.showPopup(view, state)
      },
      destroy: () => {
        this.hidePopup()
      }
    }
  },
  hidePopup() {
    const popup = document.querySelector('.mention-list')
    if (popup) {
      popup.remove()
    }
  },
  updatePopup(view, state) {
    this.hidePopup()
    this.showPopup(view, state)
  },
  showPopup(view, state) {
    const { items, selectedIndex, range } = state
    
    this.hidePopup()

    const popup = document.createElement('div')
    popup.className = 'mention-list'
    
    // Check if dark mode is active
    const isDark = document.body.classList.contains('dark')
    if (isDark) {
      popup.classList.add('dark')
    }

    items.forEach((item, index) => {
      const div = document.createElement('div')
      div.className = `mention-item ${index === selectedIndex ? 'selected' : ''}`
      div.innerHTML = `
        <div class="mention-avatar">${item.label.charAt(0)}</div>
        <span>${item.label}</span>
      `
      div.addEventListener('click', () => {
        this.selectItem(view, item)
      })
      popup.appendChild(div)
    })

    document.body.appendChild(popup)

    // Position the popup
    try {
      const coords = view.coordsAtPos(range.from)
      popup.style.left = coords.left + 'px'
      popup.style.top = (coords.bottom + 5) + 'px'
    } catch (e) {
      // Fallback positioning
      popup.style.left = '50px'
      popup.style.top = '100px'
    }
  },
  selectItem(view, item) {
    const state = this.key.getState(view.state)
    const { range } = state
    if (!range) return

    const { tr } = view.state
    const mention = view.state.schema.nodes.mention.create({
      id: item.id,
      label: item.label,
    })

    tr.replaceWith(range.from, range.to, mention)
    tr.insertText(' ')
    
    view.dispatch(tr)
    view.focus()
    this.hidePopup()
  },
})

const mentionExtension = [MentionNode, MentionSuggestionPlugin]

export default mentionExtension