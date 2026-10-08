function Lobby() {
    const navigate = useNavigate()
    return <button onClick= {() => navigate("/lobby")}>lobby maken</button>
}
export default Lobby