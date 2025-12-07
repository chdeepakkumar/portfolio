import { useState, useEffect } from 'react'
import { usePortfolio } from '../../context/PortfolioContext'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const SortableSection = ({ id, section, onToggle }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  const handleToggleClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation()
    }
    onToggle(section.id)
    return false
  }

  const handleToggleChange = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation()
    }
    onToggle(section.id)
    return false
  }

  const handleToggleMouseDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation()
    }
    // Prevent drag from starting
    e.currentTarget.setAttribute('data-no-dnd', 'true')
  }

  const handleToggleMouseUp = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation()
    }
  }

  return (
    <div ref={setNodeRef} style={style} className="section-item">
      <div className="section-drag-handle" {...attributes} {...listeners}>
        ⋮⋮
      </div>
      <div className="section-info">
        <h3>{section.id.charAt(0).toUpperCase() + section.id.slice(1)}</h3>
        <span className="section-order">Order: {section.order}</span>
      </div>
      <div 
        className="toggle-wrapper"
        onClick={handleToggleClick}
        onMouseDown={handleToggleMouseDown}
        onMouseUp={handleToggleMouseUp}
        style={{ 
          cursor: 'pointer', 
          pointerEvents: 'auto',
          position: 'relative',
          zIndex: 10,
          flexShrink: 0
        }}
      >
        <label 
          className="toggle-switch"
          onClick={handleToggleClick}
          onMouseDown={handleToggleMouseDown}
          style={{ 
            cursor: 'pointer', 
            pointerEvents: 'auto',
            margin: 0
          }}
        >
          <input
            type="checkbox"
            checked={section.visible}
            onChange={handleToggleChange}
            onClick={handleToggleClick}
            onMouseDown={handleToggleMouseDown}
            style={{ 
              pointerEvents: 'auto', 
              cursor: 'pointer'
            }}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>
    </div>
  )
}

const SectionManager = ({ onNotification }) => {
  const { portfolio, sectionOrder, updatePortfolio, updateSectionOrder, reloadPortfolio } = usePortfolio()
  const [sections, setSections] = useState([])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require 8px of movement before drag starts - prevents accidental drags when clicking
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  useEffect(() => {
    console.log('SectionManager useEffect - portfolio:', portfolio, 'sectionOrder:', sectionOrder)
    
    if (portfolio && sectionOrder && sectionOrder.length > 0) {
      // Build sections list from sectionOrder, ensuring all sections are included
      // This ensures hidden sections remain in the list so they can be toggled back on
      const sectionsList = sectionOrder.map((id, index) => {
        // Get visibility from portfolio, defaulting to true if not set
        const sectionData = portfolio[id]
        return {
          id,
          order: index + 1,
          visible: sectionData?.visible ?? true
        }
      })
      console.log('Setting sections list:', sectionsList)
      setSections(sectionsList)
    } else if (portfolio && (!sectionOrder || sectionOrder.length === 0)) {
      // If portfolio exists but no sectionOrder, show empty state
      console.warn('No section order found, portfolio sections:', Object.keys(portfolio))
      setSections([])
    } else if (!portfolio) {
      console.log('Portfolio is null, waiting for data...')
      setSections([])
    }
  }, [portfolio, sectionOrder])

  const handleDragEnd = async (event) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return // No change or invalid drop target
    }

    const oldIndex = sections.findIndex((s) => s.id === active.id)
    const newIndex = sections.findIndex((s) => s.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      console.error('Invalid section indices:', { oldIndex, newIndex, activeId: active.id, overId: over.id })
      return
    }

    const newSections = arrayMove(sections, oldIndex, newIndex)
    const updatedSections = newSections.map((s, idx) => ({
      ...s,
      order: idx + 1
    }))
    setSections(updatedSections)

    const newOrder = updatedSections.map((s) => s.id)
    try {
      await updateSectionOrder(newOrder)
      onNotification('Section order updated successfully', 'success')
    } catch (error) {
      console.error('Error updating section order:', error)
      onNotification(error.message || 'Failed to update section order', 'error')
      // Revert on error
      setSections(sections)
    }
  }

  const handleToggle = async (sectionId) => {
    const section = sections.find((s) => s.id === sectionId)
    if (!section) {
      console.error('Section not found:', sectionId)
      return
    }

    const newVisibleState = !section.visible
    // Optimistically update local state
    const updatedSections = sections.map((s) =>
      s.id === sectionId ? { ...s, visible: newVisibleState } : s
    )
    setSections(updatedSections)

    try {
      await updatePortfolio({
        sections: {
          [sectionId]: {
            visible: newVisibleState
          }
        }
      })
      onNotification(
        `Section ${newVisibleState ? 'shown' : 'hidden'} successfully`,
        'success'
      )
      // Note: updatePortfolio already calls loadPortfolio which will trigger useEffect
      // to sync sections with the updated portfolio data
    } catch (error) {
      console.error('Error updating section visibility:', error)
      onNotification(error.message || 'Failed to update section visibility', 'error')
      // Revert on error - restore original state
      const revertedSections = sections.map((s) =>
        s.id === sectionId ? { ...s, visible: section.visible } : s
      )
      setSections(revertedSections)
    }
  }

  // Debug logging
  console.log('SectionManager render - portfolio:', portfolio, 'sectionOrder:', sectionOrder, 'sections:', sections)

  if (!portfolio) {
    return (
      <div className="empty-state">
        <p>Loading sections...</p>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Waiting for portfolio data to load...
        </p>
        <button onClick={() => reloadPortfolio(true)} style={{ marginTop: '1rem' }}>Retry Loading</button>
      </div>
    )
  }

  if (!sectionOrder || sectionOrder.length === 0) {
    return (
      <div className="empty-state">
        <p>No sections found. Please check your portfolio data.</p>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Portfolio loaded but sectionOrder is empty. Available sections: {Object.keys(portfolio).join(', ')}
        </p>
        <button onClick={() => reloadPortfolio(true)}>Reload Portfolio</button>
      </div>
    )
  }

  if (sections.length === 0) {
    return (
      <div className="empty-state">
        <p>No sections to display.</p>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Section order has {sectionOrder.length} items but sections list is empty.
        </p>
        <button onClick={() => reloadPortfolio(true)}>Reload Portfolio</button>
      </div>
    )
  }

  return (
    <div>
      <h2>Manage Sections</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Drag and drop sections to reorder them. Toggle visibility to show or hide sections.
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sections.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="item-list">
            {sections.map((section) => (
              <SortableSection
                key={section.id}
                id={section.id}
                section={section}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

export default SectionManager

