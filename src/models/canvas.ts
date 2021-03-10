export interface CanvasInstance {
  _id: string,
  endpoint: string,
  /**CourseID key + last announcement ID*/
  lastAnnounce: Record<number, number>,
}

/** https://canvas.instructure.com/doc/api/courses.html */
export interface CanvasCourse {
  id: number,
  sis_course_id: string | null,
  uuid: string,
  integration_id: string | null,
  sis_import_id: string,
  name: string,
  course_code: string,
  workflow_state: string,
  account_id: string,
  root_account_id: string,
  enrollment_term_id: string,
  grading_standard_id: string,
  grade_passback_setting: string,
  created_at: Date | string,
  start_at: Date | string,
  end_at: Date | string,
  locale: string,
  enrollments: string | null,
  total_students: number | string,
  calendar: string | null,
  default_view: string,
  syllabus_body: string,
  needs_grading_count: number | string,
  term: null,
  course_progress: null,
  apply_assignment_group_weights: boolean,
  permissions: {create_discussion_topic: boolean, create_announcement: boolean},
  is_public: boolean,
  is_public_to_auth_users: boolean,
  public_syllabus: boolean,
  public_syllabus_to_auth: boolean,
  public_description: string,
  storage_quota_mb: number | string,
  storage_quota_used_mb: number | string,
  hide_final_grades: boolean,
  license: string,
  allow_student_assignment_edits: boolean,
  allow_wiki_comments: boolean,
  allow_student_forum_attachments: boolean,
  open_enrollment: boolean,
  self_enrollment: boolean,
  restrict_enrollments_to_course_dates: boolean,
  course_format: string,
  access_restricted_by_date: boolean,
  time_zone: string,
  blueprint: boolean,
  blueprint_restrictions: {content: boolean, points: boolean, due_dates: boolean, availability_dates: boolean},
  blueprint_restrictions_by_object_type: {assignment:{content: boolean, points: boolean}, wiki_page:{content: boolean}}
}

/**https://canvas.instructure.com/doc/api/modules.html */
export interface CanvasModule {
  id: number,
  workflow_state: string,
  position: string | number,
  name: string,
  unlock_at: Date | string,
  require_sequential_progress: boolean,
  prerequisite_module_ids: string[] | number[] | string | number,
  items_count: string | number,
  items_url: string,
  items: any,
  state: string,
  completed_at: string | null,
  publish_final_grade: string | null,
  published: boolean
}

/**https://canvas.instructure.com/doc/api/modules.html#method.context_module_items_api.index */
export interface CanvasModuleItem {
  id: number,
  module_id: string,
  position: string | number,
  title: string,
  indent: string | number,
  type: string,
  content_id: string | number,
  html_url: string,
  url: string,
  page_url: string,
  external_url: string,
  new_tab: boolean,
  completion_requirement: {type: string,min_score:string | number, completed:boolean},
  content_details: {points_possible: string | number, due_at: Date | string, unlock_at: Date | string, lock_at: Date | string},
  published: boolean
}

/**https://canvas.instructure.com/doc/api/discussion_topics.html#DiscussionTopic
 * `GET /api/v1/announcements` returns a discussion topic
 * https://canvas.instructure.com/doc/api/announcements.html
 */
export interface CanvasAnnouncement {
  id: number,
  title: string,
  last_reply_at: string | Date,
  created_at: string | Date,
  delayed_post_at: string | Date | null,
  posted_at: string | Date,
  assignment_id: string | number | null,
  root_topic_id: string | number | null,
  position: string | number,
  podcast_has_student_posts: boolean,
  discussion_type: string, //Has multiple set types of strings but lazy
  lock_at: string | Date | null,
  allow_rating: boolean,
  only_graders_can_rate: boolean,
  sort_by_rating: boolean,
  is_section_specific: boolean,
  user_name: string,
  discussion_subentry_count: string | number,
  permissions: { attach: boolean, update: boolean, reply: boolean, delete: boolean },
  require_initial_post: null,
  user_can_see_posts: boolean,
  podcast_url: string | null,
  read_state: string,
  unread_count: string | number,
  subscribed: boolean,
  attachments: [],
  published: boolean,
  can_unpublish: boolean,
  locked: boolean,
  can_lock: boolean,
  comments_disabled: boolean,
  author: {
    id: string | number,
    display_name: string,
    avatar_image_url: string,
    html_url: string,
    pronouns: string | null
  },
  html_url: string,
  url: string,
  pinned: boolean,
  group_category_id: null,
  can_group: boolean,
  topic_children: [],
  group_topic_children: [],
  context_code: string,
  locked_for_user: true,
  lock_info: {
      can_view: boolean,
      asset_string: string
  },
  lock_explanation: string,
  message: string,
  subscription_hold: string,
  todo_date: null | Date | string
}
