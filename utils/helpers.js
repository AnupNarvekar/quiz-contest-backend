// Paginate results
exports.paginate = (query, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  
  return {
    query: query.skip(skip).limit(limit),
    skip,
    limit
  };
};

// Format date for display
exports.formatDate = (date) => {
  return new Date(date).toISOString();
};

// Calculate contest status based on start and end times
exports.calculateContestStatus = (startTime, endTime) => {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  if (now < start) {
    return 'pending';
  } else if (now >= start && now <= end) {
    return 'live';
  } else {
    return 'complete';
  }
};