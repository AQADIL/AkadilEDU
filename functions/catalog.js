function courseSummary(course) {
  if (!course || course.published === false || course.isPublished === false) return null;
  const modules = Object.values(course.modules || {});
  const lessons = modules.flatMap((module) => Object.values(module.lessons || {}));
  return {
    title: course.title || '',
    description: course.description || '',
    coverUrl: course.coverUrl || '',
    published: true,
    moduleCount: modules.length,
    lessonCount: lessons.length,
    durationMinutes: lessons.reduce(
      (total, lesson) => total + Math.max(0, Number(lesson.duration) || 0),
      0,
    ),
  };
}

module.exports = { courseSummary };
