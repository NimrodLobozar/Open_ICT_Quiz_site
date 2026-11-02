import { App as AntApp, Modal } from "antd";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/http.js";
import { useAuth } from "../../auth/AuthContext.jsx";
import { Notice } from "../../components/AccountUi.jsx";
import { useDebounced } from "../../hooks/useDebounced.js";
import AdminLayout from "./AdminLayout.jsx";
import { QuizActions } from "./OverviewPage.jsx";
import QuizList from "./QuizList.jsx";
import SearchField from "./SearchField.jsx";

/** /admin/quizzen: alle eigen quizzen (beheerder: alle quizzen), met zoeken, bewerken, hosten en verwijderen. */
export default function QuizzesPage() {
  const { user } = useAuth();
  const { message } = AntApp.useApp();
  const [quizzes, setQuizzes] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const query = useDebounced(search);

  const load = useCallback(() => {
    api(`/quizzes?q=${encodeURIComponent(query)}`)
      .then((data) => setQuizzes(data.quizzes))
      .catch((apiError) => setError(apiError.message));
  }, [query]);

  useEffect(load, [load]);

  async function remove() {
    try {
      await api(`/quizzes/${toDelete.id}`, { method: "DELETE" });
      message.success(`"${toDelete.title}" is verwijderd.`);
      setToDelete(null);
      load();
    } catch (apiError) {
      message.error(apiError.message);
    }
  }

  return (
    <AdminLayout
      kicker={quizzes ? `${quizzes.length} quizzen` : " "}
      title="QUIZZEN"
      action={<QuizActions />}
    >
      <Notice>{error}</Notice>
      <section aria-label="Quizzen" className="ui-card admin-page__panel">
        <div className="admin-page__toolbar">
          <h2 className="ui-section-title">
            {user.role === "ADMIN" ? "Alle quizzen" : "Mijn quizzen"}
          </h2>
          <SearchField
            label="Zoek een quiz"
            value={search}
            onChange={setSearch}
          />
        </div>
        {quizzes ? (
          <QuizList
            quizzes={quizzes}
            showOwner={user.role === "ADMIN"}
            onDelete={setToDelete}
          />
        ) : (
          <p role="status">Laden…</p>
        )}
      </section>

      <Modal
        open={Boolean(toDelete)}
        title="Quiz verwijderen?"
        onCancel={() => setToDelete(null)}
        onOk={remove}
        okText="Verwijderen"
        cancelText="Annuleren"
        okButtonProps={{ danger: true }}
      >
        <p>
          &quot;{toDelete?.title}&quot; en al zijn vragen worden verwijderd.
          Uitslagen van rondes die al gespeeld zijn, blijven bewaard.
        </p>
      </Modal>
    </AdminLayout>
  );
}
