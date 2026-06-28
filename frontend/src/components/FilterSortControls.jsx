import React from 'react';
import { Search, Plus } from 'lucide-react';

const FilterSortControls = ({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  onAddTaskClick
}) => {
  return (
    <div className="controls-bar">
      <div className="search-wrapper">
        <Search className="search-icon" size={18} />
        <input
          type="text"
          className="search-input"
          placeholder="Search by title or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="filters-wrapper">
        {/* Status Filter */}
        <select
          className="select-input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          title="Filter by status"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        {/* Priority Filter */}
        <select
          className="select-input"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          title="Filter by priority"
        >
          <option value="all">All Priorities</option>
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>

        {/* Sort By Field */}
        <select
          className="select-input"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          title="Sort by field"
        >
          <option value="createdAt">Created Date</option>
          <option value="dueDate">Due Date</option>
          <option value="priority">Priority</option>
        </select>

        {/* Sort Order */}
        <select
          className="select-input"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          title="Sort order"
        >
          <option value="desc">Newest / Highest</option>
          <option value="asc">Oldest / Lowest</option>
        </select>

        <button className="btn" onClick={onAddTaskClick}>
          <Plus size={16} />
          <span>New Task</span>
        </button>
      </div>
    </div>
  );
};

export default FilterSortControls;
