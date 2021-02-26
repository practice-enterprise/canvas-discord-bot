/** https://canvas.instructure.com/doc/api/courses.html */
export interface CanvasCourse {
  id: string,
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
    // the unique identifier for the module item
    id: string,
    // the id of the Module this item appears in
    module_id: string,
    // the position of this item in the module (1-based)
    position: string | number,
    // the title of this item
    title: string,
    // 0-based indent level; module items may be indented to show a hierarchy
    indent: string | number,
    // the type of object referred to one of 'File', 'Page', 'Discussion',
    // 'Assignment', 'Quiz', 'SubHeader', 'ExternalUrl', 'ExternalTool'
    type: string,
    // the id of the object referred to applies to 'File', 'Discussion',
    // 'Assignment', 'Quiz', 'ExternalTool' types
    content_id: string | number,
    // link to the item in Canvas
    html_url: string,
    // (Optional) link to the Canvas API object, if applicable
    url: string,
    // (only for 'Page' type) unique locator for the linked wiki page
    page_url: string,
    // (only for 'ExternalUrl' and 'ExternalTool' types) external url that the item
    // points to
    external_url: string,
    // (only for 'ExternalTool' type) whether the external tool opens in a new tab
    new_tab: boolean,
    // Completion requirement for this module item
    completion_requirement: {type: string,min_score:string | number, completed:boolean},
    // (Present only if requested through include[]=content_details) If applicable,
    // returns additional details specific to the associated object
    content_details: {points_possible: string | number, due_at: Date | string, unlock_at: Date | string, lock_at: Date | string},
    // (Optional) Whether this module item is published. This field is present only
    // if the caller has permission to view unpublished items.
    published: boolean
}
