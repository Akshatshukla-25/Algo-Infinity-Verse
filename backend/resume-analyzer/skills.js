export function findMissingSkills(text) {
  const skills = ['React', 'Node', 'SQL', 'Git', 'Python'];

  return skills.filter((skill) => {
    const regex = new RegExp(`\\b${skill}\\b`, 'i');
    return !regex.test(text);
  });
}
